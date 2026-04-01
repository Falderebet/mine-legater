import { env } from '$env/dynamic/private';

export type AIProvider = 'anthropic' | 'openai' | 'nvidia';

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const NVIDIA_PRIMARY_MODEL = 'z-ai/glm5';
const NVIDIA_FALLBACK_MODEL = 'moonshotai/kimi-k2.5';

interface ChatMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

export function getProvider(): AIProvider {
	return (env.AI_PROVIDER as AIProvider) || 'anthropic';
}

export async function chatCompletion(
	messages: ChatMessage[],
	options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
	const provider = getProvider();
	const maxTokens = options?.maxTokens ?? 2048;
	const temperature = options?.temperature ?? 0.7;

	if (provider === 'anthropic') {
		const apiKey = env.ANTHROPIC_API_KEY;
		if (!apiKey) throw new Error('ANTHROPIC_API_KEY er ikke konfigureret');

		const systemMsg = messages.find((m) => m.role === 'system')?.content || '';
		const userMessages = messages
			.filter((m) => m.role !== 'system')
			.map((m) => ({ role: m.role, content: m.content }));

		const res = await fetch('https://api.anthropic.com/v1/messages', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': apiKey,
				'anthropic-version': '2023-06-01'
			},
			body: JSON.stringify({
				model: 'claude-sonnet-4-20250514',
				max_tokens: maxTokens,
				temperature,
				system: systemMsg,
				messages: userMessages
			})
		});

		if (!res.ok) {
			const err = await res.text();
			throw new Error(`Anthropic API fejl: ${res.status} ${err}`);
		}

		const data = await res.json();
		return data.content[0].text;
	} else if (provider === 'nvidia') {
		const apiKey = env.NVIDIA_API_KEY;
		if (!apiKey) throw new Error('NVIDIA_API_KEY er ikke konfigureret');

		return await nvidiaCompletion(apiKey, messages, maxTokens, temperature);
	} else {
		const apiKey = env.OPENAI_API_KEY;
		if (!apiKey) throw new Error('OPENAI_API_KEY er ikke konfigureret');

		const res = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				model: 'gpt-4o',
				messages,
				max_tokens: maxTokens,
				temperature
			})
		});

		if (!res.ok) {
			const err = await res.text();
			throw new Error(`OpenAI API fejl: ${res.status} ${err}`);
		}

		const data = await res.json();
		return data.choices[0].message.content;
	}
}

async function nvidiaCompletion(
	apiKey: string,
	messages: ChatMessage[],
	maxTokens: number,
	temperature: number
): Promise<string> {
	const models = [NVIDIA_PRIMARY_MODEL, NVIDIA_FALLBACK_MODEL];

	for (const model of models) {
		try {
			const res = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${apiKey}`
				},
				body: JSON.stringify({
					model,
					messages,
					max_tokens: maxTokens,
					temperature
				})
			});

			if (!res.ok) {
				const err = await res.text();
				if (model === NVIDIA_FALLBACK_MODEL) {
					throw new Error(`Nvidia API fejl: ${res.status} ${err}`);
				}
				console.warn(`Nvidia model ${model} fejlede (${res.status}), prøver fallback...`);
				continue;
			}

			const data = await res.json();
			return data.choices[0].message.content;
		} catch (e) {
			if (model === NVIDIA_FALLBACK_MODEL) throw e;
			console.warn(`Nvidia model ${model} fejlede, prøver fallback...`, e);
		}
	}

	throw new Error('Alle Nvidia modeller fejlede');
}

export async function* chatCompletionStream(
	messages: ChatMessage[],
	options?: { maxTokens?: number; temperature?: number }
): AsyncGenerator<string> {
	const provider = getProvider();
	const maxTokens = options?.maxTokens ?? 2048;
	const temperature = options?.temperature ?? 0.7;

	if (provider === 'anthropic') {
		const apiKey = env.ANTHROPIC_API_KEY;
		if (!apiKey) throw new Error('ANTHROPIC_API_KEY er ikke konfigureret');

		const systemMsg = messages.find((m) => m.role === 'system')?.content || '';
		const userMessages = messages
			.filter((m) => m.role !== 'system')
			.map((m) => ({ role: m.role, content: m.content }));

		const res = await fetch('https://api.anthropic.com/v1/messages', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': apiKey,
				'anthropic-version': '2023-06-01'
			},
			body: JSON.stringify({
				model: 'claude-sonnet-4-20250514',
				max_tokens: maxTokens,
				temperature,
				stream: true,
				system: systemMsg,
				messages: userMessages
			})
		});

		if (!res.ok) throw new Error(`Anthropic API fejl: ${res.status}`);

		const reader = res.body!.getReader();
		const decoder = new TextDecoder();
		let buffer = '';

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split('\n');
			buffer = lines.pop() || '';

			for (const line of lines) {
				if (line.startsWith('data: ')) {
					const data = line.slice(6);
					if (data === '[DONE]') return;
					try {
						const parsed = JSON.parse(data);
						if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
							yield parsed.delta.text;
						}
					} catch {
						// skip invalid JSON
					}
				}
			}
		}
	} else if (provider === 'nvidia') {
		const apiKey = env.NVIDIA_API_KEY;
		if (!apiKey) throw new Error('NVIDIA_API_KEY er ikke konfigureret');

		yield* nvidiaCompletionStream(apiKey, messages, maxTokens, temperature);
	} else {
		const apiKey = env.OPENAI_API_KEY;
		if (!apiKey) throw new Error('OPENAI_API_KEY er ikke konfigureret');

		const res = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				model: 'gpt-4o',
				messages,
				max_tokens: maxTokens,
				temperature,
				stream: true
			})
		});

		if (!res.ok) throw new Error(`OpenAI API fejl: ${res.status}`);

		const reader = res.body!.getReader();
		const decoder = new TextDecoder();
		let buffer = '';

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split('\n');
			buffer = lines.pop() || '';

			for (const line of lines) {
				if (line.startsWith('data: ')) {
					const data = line.slice(6);
					if (data === '[DONE]') return;
					try {
						const parsed = JSON.parse(data);
						const content = parsed.choices?.[0]?.delta?.content;
						if (content) yield content;
					} catch {
						// skip
					}
				}
			}
		}
	}
}

async function* nvidiaCompletionStream(
	apiKey: string,
	messages: ChatMessage[],
	maxTokens: number,
	temperature: number
): AsyncGenerator<string> {
	const models = [NVIDIA_PRIMARY_MODEL, NVIDIA_FALLBACK_MODEL];

	for (const model of models) {
		try {
			const res = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${apiKey}`
				},
				body: JSON.stringify({
					model,
					messages,
					max_tokens: maxTokens,
					temperature,
					stream: true
				})
			});

			if (!res.ok) {
				if (model === NVIDIA_FALLBACK_MODEL) {
					throw new Error(`Nvidia API fejl: ${res.status}`);
				}
				console.warn(`Nvidia model ${model} fejlede (${res.status}), prøver fallback...`);
				continue;
			}

			const reader = res.body!.getReader();
			const decoder = new TextDecoder();
			let buffer = '';

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n');
				buffer = lines.pop() || '';

				for (const line of lines) {
					if (line.startsWith('data: ')) {
						const data = line.slice(6);
						if (data === '[DONE]') return;
						try {
							const parsed = JSON.parse(data);
							const content = parsed.choices?.[0]?.delta?.content;
							if (content) yield content;
						} catch {
							// skip
						}
					}
				}
			}
			return;
		} catch (e) {
			if (model === NVIDIA_FALLBACK_MODEL) throw e;
			console.warn(`Nvidia model ${model} fejlede, prøver fallback...`, e);
		}
	}

	throw new Error('Alle Nvidia modeller fejlede');
}
