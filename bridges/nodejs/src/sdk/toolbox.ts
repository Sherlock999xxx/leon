import { INTENT_OBJECT } from '@bridge/constants'

/**
 * Get the widget id if any
 * @example getWidgetId() // 'timerwidget-5q1xlzeh
 */
export function getWidgetId(): string | null {
  return (
    INTENT_OBJECT.context.entities.find(
      (entity) => entity.entity === 'widgetid'
    )?.sourceText ?? null
  )
}
