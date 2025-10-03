export class CpfValidator {
  /**
   * Remove pontos, hífens e espaços do CPF
   */
  public static clean(cpf: string): string {
    return cpf.replace(/\D/g, '');
  }

  public static isValid(cpf: string): boolean {
    const cleanCpf = this.clean(cpf);

    if (cleanCpf.length !== 11) {
      return false;
    }

    if (/^(\d)\1{10}$/.test(cleanCpf)) {
      return false;
    }

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    if (remainder !== parseInt(cleanCpf.charAt(9))) {
      return false;
    }

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    if (remainder !== parseInt(cleanCpf.charAt(10))) {
      return false;
    }

    return true;
  }

  public static validateAndClean(cpf: string): {
    isValid: boolean;
    cleanCpf: string;
  } {
    const cleanCpf = this.clean(cpf);
    const isValid = this.isValid(cleanCpf);

    return { isValid, cleanCpf };
  }
}
