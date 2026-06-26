let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    // Resume context if suspended (common browser autoplay policy)
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch (err) {
    console.warn('Audio Context creation blocked or unsupported:', err);
    return null;
  }
}

export function playSound(type: 'click' | 'correct' | 'error' | 'victory' | 'erase'): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (type) {
      case 'click':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
        break;

      case 'correct':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;

      case 'error':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.setValueAtTime(120, now + 0.08);
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
        break;

      case 'victory':
        // A jubilant major arpeggio cascade
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C4, E4, G4, C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const oscNode = ctx.createOscillator();
          const subGain = ctx.createGain();
          oscNode.connect(subGain);
          subGain.connect(ctx.destination);
          
          oscNode.type = 'triangle';
          oscNode.frequency.setValueAtTime(freq, now + idx * 0.1);
          subGain.gain.setValueAtTime(0.08, now + idx * 0.1);
          subGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.4);
          
          oscNode.start(now + idx * 0.1);
          oscNode.stop(now + idx * 0.1 + 0.4);
        });
        break;

      case 'erase':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);
        gainNode.gain.setValueAtTime(0.08, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
        break;
    }
  } catch (err) {
    // Ignore audio errors if blocked by browser security
    console.warn('Audio Context block or error:', err);
  }
}
