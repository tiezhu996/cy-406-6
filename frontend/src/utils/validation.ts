import { TemplateVariable } from '../types/template';
import { VariableType } from '../types/enums';
import { VariableValues } from '../types/contract-instance';

export function validateVariables(
  variables: TemplateVariable[],
  values: VariableValues
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const variable of variables) {
    const rawValue = values[variable.name];
    const hasValue = rawValue != null && String(rawValue).trim() !== '';

    if (!hasValue) {
      if (variable.required) {
        errors[variable.name] = `请填写${variable.label || variable.name}`;
      }
      continue;
    }

    const strValue = String(rawValue).trim();

    switch (variable.type) {
      case VariableType.Number:
      case VariableType.Currency: {
        const num = Number(strValue);
        if (Number.isNaN(num) || !Number.isFinite(num)) {
          errors[variable.name] = `${variable.label || variable.name} 必须是有效的数字`;
        } else if (num < 0) {
          errors[variable.name] = `${variable.label || variable.name} 不能为负数`;
        }
        break;
      }
      case VariableType.Date: {
        const date = new Date(strValue);
        if (Number.isNaN(date.getTime())) {
          errors[variable.name] = `${variable.label || variable.name} 必须是有效的日期`;
        }
        break;
      }
      case VariableType.Text:
      case VariableType.LongText:
      default:
        break;
    }
  }

  return errors;
}

export function formatValidationMessage(errors: Record<string, string>): string {
  return Object.values(errors)
    .map((msg) => `• ${msg}`)
    .join('\n');
}
