import path from 'node:path'

import { AGENT_LLM_TARGET, WORKFLOW_LLM_TARGET } from '@/constants'
import { type ResolvedLLMTarget } from '@/core/llm-manager/llm-routing'
import { LLMProviders } from '@/core/llm-manager/types'

const UNKNOWN_LLM_NAME = 'unknown'
const NO_LOCAL_LLM_NAME = 'none'
const LOCAL_LLM_PROVIDERS = new Set<LLMProviders>([
  LLMProviders.LlamaCPP,
  LLMProviders.SGLang
])

function getTargetModelName(target: ResolvedLLMTarget): string {
  if (!target.isEnabled) {
    return 'disabled'
  }

  if (!target.isResolved || !target.model) {
    return UNKNOWN_LLM_NAME
  }

  if (LOCAL_LLM_PROVIDERS.has(target.provider)) {
    return path.basename(target.model) || target.model
  }

  return target.model
}

function getConfiguredLocalLLMName(
  workflowLLMName: string,
  agentLLMName: string
): string {
  if (LOCAL_LLM_PROVIDERS.has(WORKFLOW_LLM_TARGET.provider)) {
    return workflowLLMName
  }

  if (LOCAL_LLM_PROVIDERS.has(AGENT_LLM_TARGET.provider)) {
    return agentLLMName
  }

  return NO_LOCAL_LLM_NAME
}

export class LLMState {
  private workflowLLMName = getTargetModelName(WORKFLOW_LLM_TARGET)
  private agentLLMName = getTargetModelName(AGENT_LLM_TARGET)
  private localLLMName = getConfiguredLocalLLMName(
    this.workflowLLMName,
    this.agentLLMName
  )

  public getWorkflowLLMName(): string {
    return this.workflowLLMName
  }

  public getAgentLLMName(): string {
    return this.agentLLMName
  }

  public getLocalLLMName(): string {
    return this.localLLMName
  }

  public syncModelNames(input: {
    workflowLLMName: string
    agentLLMName: string
    localLLMName: string
  }): void {
    this.workflowLLMName = input.workflowLLMName || UNKNOWN_LLM_NAME
    this.agentLLMName = input.agentLLMName || UNKNOWN_LLM_NAME
    this.localLLMName = input.localLLMName || NO_LOCAL_LLM_NAME
  }

  public resetToConfiguredTargets(): void {
    this.workflowLLMName = getTargetModelName(WORKFLOW_LLM_TARGET)
    this.agentLLMName = getTargetModelName(AGENT_LLM_TARGET)
    this.localLLMName = getConfiguredLocalLLMName(
      this.workflowLLMName,
      this.agentLLMName
    )
  }
}
