class AudioProcessor extends AudioWorkletProcessor {
    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (input.length > 0) {
            const audioData = input[0]; // Get the first channel
            this.port.postMessage(audioData);
        }
        return true; // Keep the processor running
    }
}

registerProcessor("audio-processor", AudioProcessor);
