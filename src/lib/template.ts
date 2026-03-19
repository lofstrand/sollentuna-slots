export interface TemplateVars {
  lagNamn: string
  ledarNamn: string
  ledarMail: string
  ledarTel: string
  onskadTid: string
}

export function applyTemplate(template: string, vars: TemplateVars): string {
  return Object.entries(vars).reduce(
    (text, [key, value]) => text.split(`{${key}}`).join(value || `{${key}}`),
    template,
  )
}
