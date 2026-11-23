// Short two-tone chime for trading alerts, synthesised with Web Audio (no file needed).
let ctx: AudioContext | null = null;

export function playAlertSound() {
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    ctx = ctx ?? new AC();
    if (ctx.state === 'suspended') void ctx.resume();
    const now = ctx.currentTime;
    [[880, 0], [1320, 0.12]].forEach(([freq, delay]) => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.25, now + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.35);
      osc.connect(gain).connect(ctx!.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.4);
    });
  } catch {
    /* audio blocked until the user interacts with the page */
  }
}
