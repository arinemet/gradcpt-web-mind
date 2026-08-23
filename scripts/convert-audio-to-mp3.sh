#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg is required to convert the audio files." >&2
  exit 1
fi

for wav_file in audio-source/*.wav; do
  file_name="$(basename "$wav_file" .wav)"
  mp3_file="public/${file_name}.mp3"
  echo "Converting $wav_file"
  ffmpeg -hide_banner -loglevel error -y \
    -i "$wav_file" \
    -vn -codec:a libmp3lame -b:a 192k \
    "$mp3_file"
done

echo "Finished converting WAV files to MP3."
