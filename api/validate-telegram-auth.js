/**
 * Server-side Telegram Authentication Validation API
 * This is an example of how to implement proper server-side validation
 * 
 * For Supabase Edge Functions, this would go in supabase/functions/validate-telegram-auth/index.ts
 * For Express.js, this would be an API route
 * For Next.js, this would go in pages/api/ or app/api/
 */

import { validateTelegramInitData } from '../src/utils/telegramValidation.js';

/**
 * Validates Telegram initData on the server side
 * This is the secure way to validate Telegram authentication
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { initData } = req.body;
    
    if (!initData) {
      return res.status(400).json({ 
        valid: false, 
        error: 'Missing initData' 
      });
    }

    // Get bot token from environment variables (server-side only)
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN not configured');
      return res.status(500).json({ 
        valid: false, 
        error: 'Server configuration error' 
      });
    }

    // Validate the initData using proper cryptographic verification
    const validationResult = validateTelegramInitData(initData, botToken);
    
    if (!validationResult.valid) {
      return res.status(401).json({
        valid: false,
        error: validationResult.error
      });
    }

    // Return successful validation with user data
    return res.status(200).json({
      valid: true,
      data: validationResult.data
    });
    
  } catch (error) {
    console.error('Telegram validation error:', error);
    return res.status(500).json({ 
      valid: false, 
      error: 'Internal server error' 
    });
  }
}

/**
 * For Supabase Edge Functions, use this format:
 */
/*
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateTelegramInitData } from '../../../src/utils/telegramValidation.js'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const { initData } = await req.json()
    
    if (!initData) {
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'Missing initData' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    
    if (!botToken) {
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'Server configuration error' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const validationResult = validateTelegramInitData(initData, botToken)
    
    if (!validationResult.valid) {
      return new Response(JSON.stringify({
        valid: false,
        error: validationResult.error
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      valid: true,
      data: validationResult.data
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      valid: false, 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
*/