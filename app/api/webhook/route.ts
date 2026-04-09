// Node.js runtime required for fs.readFileSync
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import type { WhatsAppWebhookBody, WhatsAppMessage } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// --- GET: Meta webhook verification ---
export async function GET(request: NextRequest) {
  console.log('[Webhook GET] Verification request received');

  const { searchParams } = new URL(request.url);
  const mode      = searchParams.get('hub.mode');
  const token     = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('[Webhook GET] Verification successful');
    return new NextResponse(challenge, { status: 200 });
  }

  console.log('[Webhook GET] Verification failed — token mismatch or wrong mode');
  return new NextResponse('Forbidden', { status: 403 });
}

// --- POST: Incoming WhatsApp message ---
export async function POST(request: NextRequest) {
  console.log('[Webhook POST] Incoming message received');

  try {
    const body: WhatsAppWebhookBody = await request.json();

    // Safely extract the first message from the deeply nested payload
    const messageData: WhatsAppMessage | undefined =
      body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!messageData || messageData.type !== 'text' || !messageData.text?.body) {
      console.log('[Webhook POST] Non-text message or no message data, skipping');
      return NextResponse.json({ status: 'ok' }, { status: 200 });
    }

    const senderPhone   = messageData.from;
    const userText      = messageData.text.body;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;

    console.log(`[Webhook POST] Message from ${senderPhone}: "${userText}"`);

    // Load system prompt from AGENT_PROMPT.md at project root
    const promptPath   = path.join(process.cwd(), 'AGENT_PROMPT.md');
    const systemPrompt = fs.readFileSync(promptPath, 'utf-8');

    // Call OpenAI GPT-4o
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userText },
      ],
      max_tokens: 1024,
    });

    const aiReply =
      completion.choices[0]?.message?.content ??
      "Sorry, I couldn't generate a response. Please try again.";

    // Send reply via WhatsApp Cloud API
    const waResponse = await fetch(
      `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: senderPhone,
          type: 'text',
          text: { body: aiReply },
        }),
      }
    );

    if (!waResponse.ok) {
      const errorText = await waResponse.text();
      console.error('[Webhook POST] WhatsApp API error:', errorText);
    }

    // Persist conversation + messages to Supabase
    await upsertConversationAndMessages(senderPhone, userText, aiReply);

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    console.error('[Webhook POST] Unhandled error:', error);
    // Always return 200 — otherwise Meta retries indefinitely
    return NextResponse.json({ status: 'error' }, { status: 200 });
  }
}

// --- Helper: find-or-create conversation, then insert both messages ---
async function upsertConversationAndMessages(
  phone: string,
  userText: string,
  aiReply: string
): Promise<void> {
  console.log(`[Supabase] Looking up conversation for phone: ${phone}`);

  const { data: existing, error: selectError } = await supabase
    .from('conversations')
    .select('id')
    .eq('phone_number', phone)
    .single();

  // PGRST116 = "no rows returned" — expected for new contacts, not a real error
  if (selectError && selectError.code !== 'PGRST116') {
    console.error('[Supabase] Error selecting conversation:', selectError);
  }

  let conversationId: string;

  if (existing) {
    conversationId = existing.id;
    console.log(`[Supabase] Found existing conversation: ${conversationId}`);
  } else {
    console.log(`[Supabase] Creating new conversation for phone: ${phone}`);

    const { data: newConv, error: insertConvError } = await supabase
      .from('conversations')
      .insert({ phone_number: phone })
      .select('id')
      .single();

    if (insertConvError || !newConv) {
      console.error('[Supabase] Error creating conversation:', insertConvError);
      return;
    }

    conversationId = newConv.id;
    console.log(`[Supabase] Created new conversation: ${conversationId}`);
  }

  // Insert user message
  const { error: userMsgError } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    role: 'user',
    content: userText,
  });

  if (userMsgError) {
    console.error('[Supabase] Error inserting user message:', userMsgError);
  } else {
    console.log('[Supabase] User message inserted successfully');
  }

  // Insert assistant message
  const { error: asstMsgError } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    role: 'assistant',
    content: aiReply,
  });

  if (asstMsgError) {
    console.error('[Supabase] Error inserting assistant message:', asstMsgError);
  } else {
    console.log('[Supabase] Assistant message inserted successfully');
  }
}
