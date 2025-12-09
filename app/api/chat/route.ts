import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const apiBaseUrl = process.env.AI_BUILDER_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'https://space.ai-builders.com/backend';

const openai = new OpenAI({
  baseURL: `${apiBaseUrl}/v1`,
  apiKey: process.env.AI_BUILDER_TOKEN,
});

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // 验证环境变量
    if (!process.env.AI_BUILDER_TOKEN) {
      console.error('AI_BUILDER_TOKEN is not set');
      return NextResponse.json(
        { error: 'API token is not configured' },
        { status: 500 }
      );
    }

    console.log('Sending request to:', `${apiBaseUrl}/v1/chat/completions`);
    console.log('Model: grok-4-fast');
    console.log('Messages count:', messages.length);

    const completion = await openai.chat.completions.create({
      model: 'grok-4-fast',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1024,
    }, {
      timeout: 60000, // 60秒超时
    });

    const content = completion.choices[0]?.message?.content || '';

    return NextResponse.json({ content });
  } catch (error: any) {
    console.error('Chat API error:', error);
    console.error('Error type:', error.constructor?.name);
    console.error('Error message:', error.message);
    console.error('Error cause:', error.cause);
    
    // 提供更详细的错误信息
    let errorMessage = 'Failed to get response';
    if (error.code === 'ECONNRESET') {
      errorMessage = '连接被重置，请检查网络连接或稍后重试';
    } else if (error.message?.includes('timeout')) {
      errorMessage = '请求超时，请稍后重试';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

