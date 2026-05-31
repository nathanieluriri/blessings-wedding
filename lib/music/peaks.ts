// Browser-only: decode an audio File and downsample it into a normalized
// waveform (peaks 0..1) for the trim editor canvas. Imported only by client
// components. We compute peaks once at upload time and persist them so the
// editor never has to re-decode.

import { PEAK_COUNT } from "./shared";

interface DecodedAudio {
  duration: number; // seconds
  peaks: number[]; // normalized 0..1, length PEAK_COUNT
}

type AudioContextCtor = typeof AudioContext;

function getAudioContextCtor(): AudioContextCtor | null {
  if (typeof window === "undefined") return null;
  return (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: AudioContextCtor })
      .webkitAudioContext ||
    null
  );
}

/**
 * Decode `file` and return its duration + a PEAK_COUNT-length waveform.
 * Uses the Web Audio API; `decodeAudioData` detaches the passed ArrayBuffer,
 * which is fine because chunked upload reads slices straight from the File.
 */
export async function decodeAudioFile(file: File): Promise<DecodedAudio> {
  const Ctor = getAudioContextCtor();
  if (!Ctor) throw new Error("Audio decoding is not supported in this browser.");

  const arrayBuffer = await file.arrayBuffer();
  const ctx = new Ctor();
  try {
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    return {
      duration: audioBuffer.duration,
      peaks: computePeaks(audioBuffer, PEAK_COUNT),
    };
  } finally {
    // Release the hardware context; ignore environments without close().
    void ctx.close?.();
  }
}

/** Max-amplitude downsample across all channels, normalized to the loudest peak. */
function computePeaks(buffer: AudioBuffer, count: number): number[] {
  const channels = buffer.numberOfChannels;
  const length = buffer.length;
  if (length === 0 || count <= 0) return new Array(Math.max(0, count)).fill(0);

  const data: Float32Array[] = [];
  for (let c = 0; c < channels; c++) data.push(buffer.getChannelData(c));

  const blockSize = Math.max(1, Math.floor(length / count));
  const peaks = new Array<number>(count).fill(0);
  let globalMax = 0;

  for (let i = 0; i < count; i++) {
    const startSample = i * blockSize;
    const endSample = Math.min(length, startSample + blockSize);
    let max = 0;
    for (let s = startSample; s < endSample; s++) {
      for (let c = 0; c < channels; c++) {
        const v = data[c][s] < 0 ? -data[c][s] : data[c][s];
        if (v > max) max = v;
      }
    }
    peaks[i] = max;
    if (max > globalMax) globalMax = max;
  }

  if (globalMax > 0) {
    for (let i = 0; i < count; i++) {
      peaks[i] = Math.round((peaks[i] / globalMax) * 1000) / 1000;
    }
  }
  return peaks;
}
