import { TemplateVariable } from '../types/template';
import { VariableType } from '../types/enums';
import { VariableValues } from '../types/contract-instance';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateString(value: string): boolean {
  if (!DATE_REGEX.test(value)) return false;
  const [yearStr, monthStr, dayStr] = value.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (year < 100 || month < 1 || month > 12 || day < 1) return false;
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

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
        if (!isValidDateString(strValue)) {
          errors[variable.name] = `${variable.label || variable.name} 必须是 YYYY-MM-DD 格式的有效日期`;
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
