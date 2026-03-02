import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file || !file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Invalid or missing image file' }, { status: 400 });
  }

  if (isSupabaseConfigured()) {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `issues/${crypto.randomUUID()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error } = await supabase.storage.from('issue-images').upload(path, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data: urlData } = supabase.storage.from('issue-images').getPublicUrl(path);
    return NextResponse.json({ url: urlData.publicUrl });
  }

  // Mock: return placeholder based on file (deterministic from name/size)
  const seed = file.name.length + file.size;
  const placeholders = [
    'https://images.unsplash.com/photo-1542224181-5ca4cc359d04?w=400',
    'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400',
    'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=400',
  ];
  const url = placeholders[seed % placeholders.length];
  return NextResponse.json({ url });
}
