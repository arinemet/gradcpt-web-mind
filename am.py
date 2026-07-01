from scipy.io import wavfile
import numpy as np

fs, data = wavfile.read("./public/Adele_Hello.wav")

data = data.astype(np.float32)

num_samples = data.shape[0]

t = np.arange(num_samples) / fs

carrier_freq = 2 
modulation_index = 0.8

carrier = 1 + modulation_index * np.cos(2 * np.pi * carrier_freq * t)

if data.ndim == 2:
    carrier = carrier[:, np.newaxis]

modulated = data * carrier

modulated = modulated / np.max(np.abs(modulated))
modulated = (32767 * modulated).astype(np.int16)

wavfile.write("output.wav", fs, modulated)