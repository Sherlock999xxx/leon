import type { AxiosResponse } from 'axios'
import { OpenRouter } from '@openrouter/sdk'

import type {
  CompletionParams,
  OpenAITool,
  OpenAIToolChoice,
  PromptOrChatHistory
} from '@/core/llm-manager/types'
import { LogHelper } from '@/helpers/log-helper'

/**
 * @see https://openrouter.ai/docs
 */
type OpenRouterResponsesSendRequest = Parameters<
  OpenRouter['beta']['responses']['send']
>[0]
type OpenRouterResponsesRequest =
  OpenRouterResponsesSendRequest['openResponsesRequest']
type OpenRouterResponsesTool = NonNullable<
  OpenRouterResponsesRequest['tools']
>[number]
type OpenRouterResponsesToolChoice = NonNullable<
  OpenRouterResponsesRequest['toolChoice']
>
type OpenRouterResponsesTextFormat = NonNullable<
  NonNullable<OpenRouterResponsesRequest['text']>['format']
>
type OpenRouterCompletionParams = Omit<CompletionParams, ''>

export default class OpenRouterLLMProvider {
  protected readonly name = 'OpenRouter LLM Provider'
  protected readonly apiKey = process.env['LEON_OPENROUTER_API_KEY']
  protected readonly model =
    process.env['LEON_OPENROUTER_AGENT_LLM'] ||
    process.env['LEON_OPENROUTER_MODEL'] ||
    'openrouter/auto'
  private readonly client = new OpenRouter({
    apiKey: this.apiKey,
    timeoutMs: 120_000,
    retryConfig: {
      strategy: 'backoff',
      retryConnectionErrors: true,
      backoff: {
        initialInterval: 400,
        maxInterval: 2_500,
        exponent: 2,
        maxElapsedTime: 8_000
      }
    }
  })

  constructor() {
    LogHelper.title(this.name)
    LogHelper.success('New instance')

    this.checkAPIKey()
  }

  public get modelName(): string {
    return this.model
  }

  private checkAPIKey(): void {
    if (!this.apiKey || this.apiKey === '') {
      LogHelper.title(this.name)

      const errorMessage = `${this.name} API key is not defined. Please define it in the .env file`
      LogHelper.error(errorMessage)
      throw new Error(errorMessage)
    }
  }

  private formatErrorForLog(error: unknown): string {
    if (!error || typeof error !== 'object') {
      return String(error)
    }

    const errorObject = error as Record<string, unknown>
    const details: Record<string, unknown> = {
      name:
        typeof errorObject['name'] === 'string'
          ? (errorObject['name'] as string)
          : 'Error',
      message:
        typeof errorObject['message'] === 'string'
          ? (errorObject['message'] as string)
          : String(error)
    }

    if (typeof errorObject['statusCode'] === 'number') {
      details['statusCode'] = errorObject['statusCode']
    }
    if (errorObject['body'] !== undefined) {
      details['body'] = errorObject['body']
    }
    if (errorObject['error'] !== undefined) {
      details['error'] = errorObject['error']
    }
    if (errorObject['cause'] !== undefined) {
      details['cause'] = String(errorObject['cause'])
    }

    try {
      return JSON.stringify(details)
    } catch {
      return String(error)
    }
  }

  private toTools(tools: OpenAITool[]): OpenRouterResponsesTool[] {
    return tools.map((tool) => ({
      type: 'function',
      name: tool.function.name,
      ...(tool.function.description
        ? { description: tool.function.description }
        : {}),
      parameters: tool.function.parameters as Record<string, unknown>,
      strict: false
    }))
  }

  private toToolChoice(
    toolChoice: OpenAIToolChoice
  ): OpenRouterResponsesToolChoice {
    if (typeof toolChoice === 'string') {
      return toolChoice
    }

    return {
      type: 'function',
      name: toolChoice.function.name
    }
  }

  private toResponsesJSONSchema(
    schema: Record<string, unknown> | null | undefined
  ): OpenRouterResponsesTextFormat | null {
    if (!schema) {
      return null
    }

    const effectiveSchema =
      ('type' in schema || 'oneOf' in schema)
        ? schema
        : {
            type: 'object',
            properties: schema
          }

    return {
      type: 'json_schema',
      name: 'structured_output',
      schema: effectiveSchema as Record<string, unknown>,
      strict: false
    }
  }

  private toInputMessages(
    prompt: PromptOrChatHistory,
    completionParams: OpenRouterCompletionParams
  ): OpenRouterResponsesRequest['input'] {
    const messages: Array<{
      role: 'assistant' | 'user'
      content: string
    }> = []

    if (completionParams.history) {
      for (const message of completionParams.history) {
        messages.push({
          role: message.who === 'leon' ? 'assistant' : 'user',
          content: message.message
        })
      }
    }

    const promptText =
      typeof prompt === 'string' ? prompt : JSON.stringify(prompt)
    const lastMessage = messages[messages.length - 1]
    if (
      messages.length === 0 ||
      !lastMessage ||
      lastMessage.content !== promptText
    ) {
      messages.push({
        role: 'user',
        content: promptText
      })
    }

    return messages as OpenRouterResponsesRequest['input']
  }

  public runChatCompletion(
    prompt: PromptOrChatHistory,
    completionParams: OpenRouterCompletionParams
  ): Promise<AxiosResponse> {
    return new Promise(async (resolve, reject) => {
      try {
        this.checkAPIKey()

        const openResponsesRequest: OpenRouterResponsesRequest = {
          input: this.toInputMessages(prompt, completionParams),
          model: this.model,
          instructions: completionParams.systemPrompt,
          ...(typeof completionParams.maxTokens === 'number'
            ? { maxOutputTokens: completionParams.maxTokens }
            : {}),
          stream: completionParams.shouldStream === true
        }
        const providerPreferences: NonNullable<
          OpenRouterResponsesRequest['provider']
        > = {}

        if (completionParams.tools && completionParams.tools.length > 0) {
          openResponsesRequest.tools = this.toTools(completionParams.tools)
          if (completionParams.toolChoice !== undefined) {
            openResponsesRequest.toolChoice = this.toToolChoice(
              completionParams.toolChoice
            )
          }
          providerPreferences.requireParameters = true
        } else if (completionParams.data !== null) {
          const jsonSchema = this.toResponsesJSONSchema(completionParams.data)
          if (jsonSchema) {
            openResponsesRequest.text = {
              format: jsonSchema
            }
          }
        }

        if (!completionParams.tools || completionParams.tools.length === 0) {
          providerPreferences.order = ['cerebras']
        }

        if (completionParams.disableThinking === true) {
          openResponsesRequest.reasoning = {
            enabled: false
          }
          LogHelper.title(this.name)
          LogHelper.debug('Thinking disabled for this request')
        }

        if (Object.keys(providerPreferences).length > 0) {
          openResponsesRequest.provider = providerPreferences
        }

        const requestOptions = {
          ...(typeof completionParams.timeout === 'number'
            ? { timeoutMs: completionParams.timeout }
            : {}),
          ...(completionParams.signal
            ? { signal: completionParams.signal }
            : {})
        }

        const response = await this.client.beta.responses.send(
          {
            openResponsesRequest
          },
          requestOptions
        )
        return resolve({
          data: response
        } as AxiosResponse)
      } catch (e) {
        const errorMessage = `Failed to run completion: ${this.formatErrorForLog(e)}`

        LogHelper.title(this.name)
        LogHelper.error(errorMessage)
        return reject(e instanceof Error ? e : new Error(errorMessage))
      }
    })
  }
}
