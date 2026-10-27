# /// script
# requires-python = ">=3.11,<3.14"
# dependencies = ["torch", "transformers", "soundfile", "soxr", "numpy"]
# ///
"""Shared audio helpers: loading, silence trimming, phoneme recognition."""
from functools import lru_cache

import numpy as np
import soundfile as sf
import soxr

SR = 16000
MODEL = "facebook/wav2vec2-lv-60-espeak-cv-ft"


def load(path, sr=SR):
    audio, rate = sf.read(path, dtype="float32", always_2d=True)
    audio = audio.mean(axis=1)
    if rate != sr:
        audio = soxr.resample(audio, rate, sr)
    return audio


def trim(audio, sr=SR, db=-40, pad=0.03):
    """Cut leading/trailing silence (relative to the loudest 20 ms frame)."""
    hop = int(sr * 0.01)
    frames = np.lib.stride_tricks.sliding_window_view(audio, hop * 2)[::hop]
    rms = np.sqrt((frames ** 2).mean(axis=1) + 1e-12)
    level = 20 * np.log10(rms / rms.max())
    loud = np.nonzero(level > db)[0]
    if not len(loud):
        return audio
    start = max(0, loud[0] * hop - int(pad * sr))
    end = min(len(audio), (loud[-1] + 2) * hop + int(pad * sr))
    return audio[start:end]


@lru_cache(1)
def _model():
    import torch
    from transformers import AutoModelForCTC, Wav2Vec2FeatureExtractor, Wav2Vec2PhonemeCTCTokenizer

    torch.set_grad_enabled(False)
    # do_phonemize=False: we only decode, so the phonemizer/espeak backend isn't needed.
    tok = Wav2Vec2PhonemeCTCTokenizer.from_pretrained(MODEL, do_phonemize=False)
    return (Wav2Vec2FeatureExtractor.from_pretrained(MODEL), tok), AutoModelForCTC.from_pretrained(MODEL).eval()


def recognize(audio):
    """Phonemes (espeak IPA) heard in a 16 kHz clip, as a list of symbols."""
    import torch

    (features, tok), model = _model()
    inputs = features(audio, sampling_rate=SR, return_tensors="pt")
    ids = torch.argmax(model(inputs.input_values).logits, dim=-1)
    return tok.batch_decode(ids)[0].split()
