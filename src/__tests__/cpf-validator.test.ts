import { CpfValidator } from '../utils/cpf-validator';

describe('CpfValidator', () => {
  describe('clean', () => {
    it('should remove dots and hyphens from CPF', () => {
      expect(CpfValidator.clean('123.456.789-01')).toBe('12345678901');
      expect(CpfValidator.clean('111.111.111-11')).toBe('11111111111');
    });

    it('should handle CPF without formatting', () => {
      expect(CpfValidator.clean('12345678901')).toBe('12345678901');
    });

    it('should handle empty string', () => {
      expect(CpfValidator.clean('')).toBe('');
    });
  });

  describe('isValid', () => {
    it('should validate correct CPFs', () => {
      expect(CpfValidator.isValid('11144477735')).toBe(true);
      expect(CpfValidator.isValid('12345678909')).toBe(true);
    });

    it('should reject CPFs with all same digits', () => {
      expect(CpfValidator.isValid('11111111111')).toBe(false);
      expect(CpfValidator.isValid('22222222222')).toBe(false);
      expect(CpfValidator.isValid('00000000000')).toBe(false);
    });

    it('should reject CPFs with wrong length', () => {
      expect(CpfValidator.isValid('123')).toBe(false);
      expect(CpfValidator.isValid('123456789012')).toBe(false);
      expect(CpfValidator.isValid('')).toBe(false);
    });

    it('should reject CPFs with invalid check digits', () => {
      expect(CpfValidator.isValid('12345678901')).toBe(false);
      expect(CpfValidator.isValid('11111111112')).toBe(false);
    });

    it('should validate CPFs with formatting', () => {
      expect(CpfValidator.isValid('111.444.777-35')).toBe(true);
      expect(CpfValidator.isValid('123.456.789-09')).toBe(true);
    });
  });
});
