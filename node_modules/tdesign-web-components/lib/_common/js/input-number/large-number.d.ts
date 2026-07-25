export type InputNumberDecimalPlaces = number | {
    enableRound: boolean;
    places: number;
};
export declare function fillZero(length: number): string;
/**
 * 大数，是否是一个数字，数字字符包括 - . e [0-9]
 */
export declare function isInputNumber(num: number | string): boolean;
export declare function removeInvalidZero(num: string, decimal?: boolean): string;
/**
 * 大数加法，仅支持正整数（没有精度问题）
 * @param num1 被加数
 * @param num2 加数
 */
export declare function largeIntNumberAdd(num1: string, num2: string, decimal?: boolean): string;
/**
 * 大数加法，支持小数和整数（没有精度问题）
 * @param num1 被加数
 * @param num2 加数
 */
export declare function largePositiveNumberAdd(num1: string, num2: string): string;
/**
 * 2e3 => 2000
 * 0.2e3 => 200
 */
export declare function formatENumber(num: string): string;
/**
 * 比较两个大数的大小
 */
export declare function compareLargeNumber(num1: string, num2: string): 1 | -1 | 0;
export declare function isInfinity(num: number | string): boolean;
export declare function isSafeNumber(num: string | number): boolean;
/**
 * 比较两个数的大小
 */
export declare function compareNumber(num1: string | number, num2: string | number, largeNumber?: boolean): 0 | 1 | -1;
/**
 * 大数减法，仅支持整数
 * @param num1 被减数
 * @param num2 减数
 * @param decimal 是否为小数位相减
 */
export declare function largeIntegerNumberSubtract(num1: string, num2: string, p?: {
    decimal?: boolean;
    stayZero?: boolean;
}): string;
/**
 * 大数减法，支持整数和小数（无精度问题）
 * @param num1 被减数
 * @param num2 减数
 * @param decimal 是否为小数位相减
 */
export declare function largePositiveNumberSubtract(num1: string, num2: string): string;
/**
 * -0.6 - 0.8        =>  -(0.6 + 0.8)
 * -0.6 - (-0.8)     =>  0.8 - 0.6
 * 0.6 - (-0.8)      => 0.6 + 0.8
 * 0.6 - 0.8         => 0.6 - 0.8
 */
export declare function largeNumberSubtract(num1: string, num2: string): string;
/**
 * -0.6 + 0.8        =>  0.8 - 0.6
 * -0.6 + (-0.8)     =>  -(0.6 + 0.8)
 * 0.6 + (-0.8)      => 0.6 - 0.8
 * 0.6 + 0.8         => 0.6 + 0.8
 */
export declare function largeNumberAdd(num1: string, num2: string): string;
/**
 * 格式化小数，并且可以控制小数点后的位数和是否进行四舍五入。
 *
 * @param {number} num - 要格式化的数字。
 * @param {number} places - 小数点后的位数。
 * @param {boolean} rounding - 是否进行四舍五入。
 * @returns {string} 格式化后的数字字符串。
 */
export declare function formatDecimal(num: number, places: number, enableRound?: boolean): string;
export declare function decimalPlacesToFixedNum(num: number, decimalPlaces: InputNumberDecimalPlaces): string;
/**
 * 大数保留 N 位小数（没有精度问题）
 * @param {String} number 大数（只能使用字符串表示）
 * @param {Number} decimalPlaces 保留的小数位数
 * @param {Boolean} largeNumber 是否为大数
 */
export declare function largeNumberToFixed(number: string | number, decimalPlaces?: InputNumberDecimalPlaces, largeNumber?: boolean): string;
