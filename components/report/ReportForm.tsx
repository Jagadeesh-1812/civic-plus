'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import type { IssueType, Severity } from '@/lib/types';

const ISSUE_LABELS: Record<IssueType, string> = {
  pothole: 'Pothole / Road Damage',
  garbage: 'Garbage / Waste',
  streetlight: 'Broken Streetlight',
  water_leak: 'Water Leak / Drainage',
  other: 'Other',
};

const SEVERITY_LABELS: Record<Severity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export default function ReportForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [issueType, setIssueType] = useState<IssueType>('other');
  const [severity, setSeverity] = useState<Severity>('medium');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith('image/')) return;
    setImage(file);
    setImageUrl(URL.createObjectURL(file));
  }, []);

  const fetchLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation({ lat: 40.7128, lng: -74.006 });
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      () => {
        setLocation({ lat: 40.7128, lng: -74.006 });
        setLoading(false);
      }
    );
  }, []);

  const runAIClassify = useCallback(async () => {
    if (!imageUrl) return;
    setLoading(true);
    try {
      const fd = new FormData();
      if (image) fd.append('file', image);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd });
      const { url } = await uploadRes.json();
      if (!url) throw new Error('Upload failed');

      const classifyRes = await fetch('/api/ai/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: url || imageUrl, text: description }),
      });
      const { issue_type, severity: s } = await classifyRes.json();
      setIssueType(issue_type ?? 'other');
      setSeverity(s ?? 'medium');
    } catch (e) {
      setError('AI classification failed, using defaults');
    } finally {
      setLoading(false);
    }
  }, [imageUrl, image, description]);

  const handleSubmit = async () => {
    if (!location) {
      setError('Please enable location');
      return;
    }

    let finalImageUrl: string | null = null;
    if (image) {
      const fd = new FormData();
      fd.append('file', image);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd });
      const { url } = await uploadRes.json();
      finalImageUrl = url;
    } else if (imageUrl?.startsWith('http')) {
      finalImageUrl = imageUrl;
    }

    if (!finalImageUrl) {
      setError('Please add an image');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: finalImageUrl,
          description: description || null,
          issue_type: issueType,
          severity,
          lat: location.lat,
          lng: location.lng,
          address: null,
          reporter_id: user?.id ?? null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const issue = await res.json();
      router.push(`/issue/${issue.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {step === 1 && (
        <>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Photo of the issue</label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageChange}
              className="block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-rose-50 file:text-rose-700"
            />
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Preview"
                className="mt-2 w-full h-48 object-cover rounded-lg border border-stone-200"
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the issue..."
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 placeholder:text-stone-400 bg-white"
              rows={2}
            />
          </div>
          <button
            onClick={() => {
              fetchLocation();
              runAIClassify();
              setStep(2);
            }}
            disabled={!imageUrl}
            className="w-full py-3 bg-rose-500 text-white rounded-xl font-medium disabled:opacity-50"
          >
            Next →
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">AI-detected type</label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value as IssueType)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 bg-white"
            >
              {Object.entries(ISSUE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Severity</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as Severity)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 bg-white"
            >
              {Object.entries(SEVERITY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Location</label>
            <p className="text-sm text-stone-600">
              {location
                ? `📍 ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
                : 'Getting location...'}
            </p>
            <button
              onClick={fetchLocation}
              className="mt-1 text-sm text-rose-600 hover:underline"
            >
              Update location
            </button>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-3 border border-stone-300 rounded-xl font-medium"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !location}
              className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-medium disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
