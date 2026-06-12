import { describe, it, expect } from 'vitest';
import { isValidDateString, validateVariables, formatValidationMessage } from '../src/utils/validation';
import { VariableType } from '../src/types/enums';
import type { TemplateVariable } from '../src/types/template';

function makeVar(overrides: Partial<TemplateVariable>): TemplateVariable {
  return {
    id: 'v1',
    name: 'testVar',
    label: '测试变量',
    type: VariableType.Text,
    defaultValue: '',
    required: false,
    ...overrides
  };
}

describe('isValidDateString', () => {
  describe('正常合法日期', () => {
    it.each([
      '2024-02-29',
      '2026-01-01',
      '2026-12-31',
      '2026-06-13',
      '2024-06-30',
      '2024-01-31',
      '2000-02-29',
      '1970-01-01',
      '9999-12-31'
    ])('%s 应返回 true', (input) => {
      expect(isValidDateString(input)).toBe(true);
    });
  });

  describe('非法日期', () => {
    it.each([
      '2026-02-31',
      '2026-02-30',
      '2026-02-29',
      '2026-04-31',
      '2026-06-31',
      '2026-09-31',
      '2026-11-31',
      '2026-13-01',
      '2026-00-01',
      '2026-01-00',
      '2026-01-32',
      '2100-02-29',
      '1900-02-29',
      '0099-01-01'
    ])('%s 应返回 false', (input) => {
      expect(isValidDateString(input)).toBe(false);
    });
  });

  describe('格式不对', () => {
    it.each([
      '2026/06/13',
      '2026-6-13',
      '2026-06-1',
      '20260613',
      '2026-06-13T00:00:00Z',
      'Jun 13, 2026',
      '',
      'abc',
      '2026-02-31x'
    ])('%s 应返回 false', (input) => {
      expect(isValidDateString(input)).toBe(false);
    });
  });
});

describe('validateVariables - Date 类型', () => {
  it('required 且为空 → 提示请填写', () => {
    const variables = [makeVar({ name: 'd', label: '签约日期', type: VariableType.Date, required: true })];
    expect(validateVariables(variables, { d: '' })).toEqual({ d: '请填写签约日期' });
    expect(validateVariables(variables, { d: '   ' })).toEqual({ d: '请填写签约日期' });
    expect(validateVariables(variables, {})).toEqual({ d: '请填写签约日期' });
  });

  it('非 required 且为空 → 无错误', () => {
    const variables = [makeVar({ name: 'd', type: VariableType.Date, required: false })];
    expect(validateVariables(variables, { d: '' })).toEqual({});
  });

  it('required + 非严格合法日期 → 报格式错误', () => {
    const variables = [makeVar({ name: 'd', label: '签约日期', type: VariableType.Date, required: true })];
    expect(validateVariables(variables, { d: '2026-02-31' })).toEqual({
      d: '签约日期 必须是 YYYY-MM-DD 格式的有效日期'
    });
    expect(validateVariables(variables, { d: '2026-02-29' })).toEqual({
      d: '签约日期 必须是 YYYY-MM-DD 格式的有效日期'
    });
    expect(validateVariables(variables, { d: '2024-02-29' })).toEqual({});
  });
});

describe('validateVariables - Number / Currency 类型', () => {
  it('数字格式不正确', () => {
    const variables = [makeVar({ name: 'n', label: '数量', type: VariableType.Number, required: true })];
    expect(validateVariables(variables, { n: 'abc' })).toEqual({ n: '数量 必须是有效的数字' });
    expect(validateVariables(variables, { n: '12.34' })).toEqual({});
    expect(validateVariables(variables, { n: '-1' })).toEqual({ n: '数量 不能为负数' });
  });

  it('金额也按数字校验', () => {
    const variables = [makeVar({ name: 'c', label: '金额', type: VariableType.Currency, required: true })];
    expect(validateVariables(variables, { c: 'NaN' })).toEqual({ c: '金额 必须是有效的数字' });
    expect(validateVariables(variables, { c: '100' })).toEqual({});
  });
});

describe('validateVariables - Text 类型', () => {
  it('required 空值 → 提示请填写；非 required 任意文本 → 通过', () => {
    const req = [makeVar({ name: 't', label: '甲方', type: VariableType.Text, required: true })];
    const opt = [makeVar({ name: 't', type: VariableType.Text, required: false })];
    expect(validateVariables(req, { t: '' })).toEqual({ t: '请填写甲方' });
    expect(validateVariables(req, { t: '张三' })).toEqual({});
    expect(validateVariables(opt, { t: '' })).toEqual({});
  });
});

describe('formatValidationMessage', () => {
  it('空错误 → 空字符串', () => {
    expect(formatValidationMessage({})).toBe('');
  });

  it('多条错误 → 每条带 • 前缀并用换行连接', () => {
    const msg = formatValidationMessage({ a: '请填写A', b: 'B 格式错误' });
    expect(msg).toContain('• 请填写A');
    expect(msg).toContain('• B 格式错误');
    expect(msg.split('\n')).toHaveLength(2);
  });
});
