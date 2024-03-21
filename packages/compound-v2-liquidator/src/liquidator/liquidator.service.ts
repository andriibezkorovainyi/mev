import { Service } from '../../utils/classes/service.ts';
import type { TokenConfigEntity } from '../price-oracle/token-config.entity.ts';
import type { StorageService } from '../storage/storage.service.ts';
import type { PriceOracleService } from '../price-oracle/price-oracle.service.ts';
import {
  mul_Mantissa,
  mulScalarTruncateAddUInt,
} from '../../utils/math/ExpNoError.ts';
import type { AccountEntity } from '../account/account.entity.ts';

export class LiquidatorService extends Service {
  constructor(
    private readonly storageService: StorageService,
    private readonly priceOracleService: PriceOracleService,
  ) {
    super();
  }

  async processPendingPriceUpdate(data: TokenConfigEntity) {
    console.log('method -> liquidatorService.processPendingPriceUpdate');

    const market = this.storageService.getMarket(data.marketAddress);
    market.underlyingPriceMantissa =
      this.priceOracleService.getUnderlyingPrice(data);

    // подсчитать новый borrowIndex

    const accounts = market.accounts.values();

    const promises = [];

    for (const account of accounts) {
      promises.push(this.calculateAccountLiquidity(account));
    }

    await Promise.all(promises);
  }

  async calculateAccountLiquidity(_address: string) {
    console.debug('method -> liquidatorService.calculateAccountLiquidity');

    const account = this.storageService.getAccount(_address)!;

    const { assets, tokens } = account;

    let sumCollateral = 0n;
    let sumBorrow = 0n;

    for (const asset of assets) {
      const { address, principal, interestIndex } = asset;
      const {
        borrowIndex,
        exchangeRateMantissa,
        collateralFactorMantissa,
        underlyingPriceMantissa,
      } = this.storageService.getMarket(address);

      const balance = tokens[address];
      const borrowBalance = this.borrowBalance(
        principal,
        interestIndex,
        borrowIndex,
      );

      // console.log('borrowBalance', borrowBalance);
      // console.log('balance', balance);
      // console.log('underlyingPriceMantissa', underlyingPriceMantissa);
      // console.log('exchangeRateMantissa', exchangeRateMantissa);
      // console.log('collateralFactorMantissa', collateralFactorMantissa);
      // console.log('borrowIndex', borrowIndex);

      const tokensToDenomMantissa = mul_Mantissa(
        mul_Mantissa(collateralFactorMantissa, exchangeRateMantissa),
        underlyingPriceMantissa,
      );

      sumCollateral = mulScalarTruncateAddUInt(
        tokensToDenomMantissa,
        balance,
        sumCollateral,
      );
      sumBorrow = mulScalarTruncateAddUInt(
        underlyingPriceMantissa,
        borrowBalance,
        sumBorrow,
      );
    }

    // return [sumCollateral, sumBorrow] as const;

    if (sumBorrow >= sumCollateral) {
      this.liquidate(account).catch(console.error);
    }
  }

  borrowBalance(principal: bigint, interestIndex: bigint, borrowIndex: bigint) {
    if (principal === 0n) {
      return 0n;
    }

    return (principal * borrowIndex) / interestIndex;
  }

  async liquidate(account: AccountEntity) {
    console.log('method -> liquidatorService.liquidate');
    const collateral = this.findCollateralToLiquidate(account);
    const borrowAsset = this.findBorrowToLiquidate(account);
  }

  findBorrowToLiquidate(account: AccountEntity) {
    console.log('method -> liquidatorService.findBorrowToLiquidate');
    const assets = account.assets;

    for (const asset of assets) {
      const { principal, interestIndex, address } = asset;
      const { borrowIndex, exchangeRateMantissa, underlyingPriceMantissa } =
        this.storageService.getMarket(address);
    }
  }

  findCollateralToLiquidate(account: AccountEntity) {
    console.log('method -> liquidatorService.findCollateralToLiquidate');

    const tokens = Object.entries(account.tokens);

    const tokenAmounts: [string, bigint][] = [];

    for (const [address, balance] of tokens) {
      if (balance === 0n) {
        continue;
      }

      const { exchangeRateMantissa, underlyingPriceMantissa } =
        this.storageService.getMarket(address);

      const ratio = mul_Mantissa(underlyingPriceMantissa, exchangeRateMantissa);
      const tokenAmount = mul_Mantissa(ratio, balance);

      tokenAmounts.push([address, tokenAmount]);
    }

    tokenAmounts.sort((a, b) => Number(b[1]) - Number(a[1]));

    return account.tokens[tokenAmounts[0][0]];
  }
}
