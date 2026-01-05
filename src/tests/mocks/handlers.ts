import { http, HttpResponse } from 'msw';

/**
 * MSW Request Handlers
 * Define mock API responses for testing
 */
export const handlers = [
	// Example: Mock OpenRouter API
	http.post('https://openrouter.ai/api/v1/chat/completions', () => {
		return HttpResponse.json({
			id: 'mock-id',
			choices: [
				{
					message: {
						role: 'assistant',
						content: 'This is a mocked response from OpenRouter',
					},
					finish_reason: 'stop',
				},
			],
			usage: {
				prompt_tokens: 10,
				completion_tokens: 20,
				total_tokens: 30,
			},
		});
	}),

	// Add more handlers as needed for your API endpoints
	// http.get('/api/example', () => {
	//   return HttpResponse.json({ data: 'example' });
	// }),
];
