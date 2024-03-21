import type { AccountService } from '../account/account.service.ts';
import { Service } from '../../utils/classes/service.ts';
import type { StorageService } from '../storage/storage.service.ts';
import type { Web3Service } from '../web3/web3.service.ts';
import { MarketEventName, MarketEventToOutput } from './market.constants.ts';
import CToken from '../../../../common/compound-protocol/artifacts/CToken.sol/CToken.json';
import {
  filterAbi,
  getAbiItem,
  sortLogs,
} from '../../utils/helpers/array.helpers.ts';
import CErc20 from '../../../../common/compound-protocol/artifacts/CErc20.sol/CErc20.json';

export class MarketService extends Service {
  constructor(
    private readonly storageService: StorageService,
    private readonly web3Service: Web3Service,
    private readonly accountService: AccountService,
    // private readonly interestRateModelService: InterestRateModelService,
  ) {
    super();
  }

  processLogs(logs) {
    for (const log of logs) {
      switch (log.eventName) {
        case MarketEventName.AccrueInterest:
          this.accrueInterest(log);
          break;
        case MarketEventName.Transfer:
          this.transfer(log);
          break;
        case MarketEventName.Mint:
          this.mint(log);
          break;
        case MarketEventName.Redeem:
          this.redeem(log);
          break;
        case MarketEventName.Borrow:
          this.borrow(log);
          break;
        case MarketEventName.RepayBorrow:
          this.repayBorrow(log);
          break;
        case MarketEventName.ReservesAdded:
          this.reservesAdded(log);
          break;
        case MarketEventName.ReservesReduced:
          this.reservesReduced(log);
          break;
        case MarketEventName.NewReserveFactor:
          this.newReserveFactor(log);
          break;
        // case MarketEventName.LiquidateBorrow:
        // this.liquidateBorrow(log);
        // break;
      }
    }
  }

  accrueInterest(log) {
    console.debug('function -> accrueInterest');

    const [key1, key2, key3, key4] =
      MarketEventToOutput[MarketEventName.AccrueInterest].split(',');

    const interestAccumulated: bigint = log[key1]; // можно высчитать borrowRate;
    const borrowIndex: bigint = log[key2];
    const totalBorrows: bigint = log[key3];
    const cashPrior: bigint | undefined = log[key4];

    const market = this.storageService.getMarket(log.address);
    // console.log('before market', market);

    market.totalBorrows = totalBorrows;
    market.borrowIndex = borrowIndex;

    if (cashPrior) {
      market.totalCash = cashPrior;
    }

    market.accrualBlockNumber = BigInt(log.blockNumber);

    // try {
    //   const [actualTotalReserves, totalCash] = await Promise.all([
    //     this.fetchMarketTotalReserves(log.address, log.blockNumber),
    //     this.fetchMarketTotalCash(log.address, log.blockNumber),
    //   ]);
    //   market.totalReserves = actualTotalReserves;
    //   console.log('after market', market);
    // } catch (e) {
    //   console.error(e);
    // }
  }

  private transfer(log) {
    // Фиксирует только переводы между аккаунтами, не учитываем маркеты
    console.debug('function -> transfer');
    const [key1, key2, key3] =
      MarketEventToOutput[MarketEventName.Transfer].split(',');

    const from = log[key1];
    const to = log[key2];
    const amount = log[key3]; // cTokens
    const cToken = log.address;

    const accountFrom = this.storageService.getAccount(from);
    const marketFrom = this.storageService.getMarket(from);
    const accountTo = this.storageService.getAccount(to);
    const marketTo = this.storageService.getMarket(to);

    if (marketFrom || marketTo) {
      return;
    }

    if (accountFrom) {
      this.accountService.defundAccountBalance(accountFrom, cToken, amount);
    }

    if (accountTo) {
      this.accountService.fundAccountTokens(accountTo, cToken, amount);
    } else {
      this.accountService.createAccountWithToken(to, cToken, amount);
    }

    // if (accountTo) {
    //   this.accountService.fundAccountTokens(accountTo, cToken, amount);
    // } else {
    //   this.accountService.createAccountWithToken(to, cToken, amount);
    // }

    // const marketFrom = this.storageService.getMarket(from);
    // const marketTo = this.storageService.getMarket(to);
    // Обрабатывается событием Mint
    // if (marketFrom) {
    //   return;
    // }

    // if (accountFrom) {
    //
    // } else {
    //   throw new Error('Account not found');
    // }

    // if (marketTo) {
    //   // Обрабатывается событием Redeem
    // } else
  }

  private mint(log) {
    console.debug('function -> mint');
    const [key1, key2, key3] =
      MarketEventToOutput[MarketEventName.Mint].split(',');

    const minter = log[key1];
    const mintAmount = log[key2];
    const mintTokens = log[key3];

    const market = this.storageService.getMarket(log.address);
    const account = this.storageService.getAccount(minter);

    market.totalSupply += mintTokens;
    market.totalCash += mintAmount;

    if (account) {
      this.accountService.fundAccountTokens(account, log.address, mintTokens);
    } else {
      this.accountService.createAccountWithToken(
        minter,
        log.address,
        mintTokens,
      );
    }
  }

  private redeem(log) {
    console.debug('function -> redeem');

    const [key1, key2, key3] =
      MarketEventToOutput[MarketEventName.Redeem].split(',');

    const cToken = log.address;
    const redeemer = log[key3];
    const redeemAmount = log[key1];
    const redeemTokens = log[key2];
    const market = this.storageService.getMarket(log.address);
    const account = this.storageService.getAccount(redeemer);
    if (!account) throw new Error('Account not found');

    market.totalCash -= redeemAmount;
    market.totalSupply -= redeemTokens;

    this.accountService.defundAccountBalance(account, cToken, redeemTokens);
  }

  private newReserveFactor(log) {
    console.debug('function -> newReserveFactor');
    const key = MarketEventToOutput[MarketEventName.NewReserveFactor];
    const newReserveFactorMantissa = log[key];
    const market = this.storageService.getMarket(log.address);
    market.reserveFactorMantissa = newReserveFactorMantissa;
  }

  // private liquidateBorrow(log) {
  //   const [key1, key2, key3, key4, key5] =
  //     MarketEventToOutput[MarketEventName.LiquidateBorrow].split(',');

  // const liquidator = log[key1];
  // const borrower = log[key2];
  // const repayAmount = log[key3];
  // const cTokenCollateral = log[key4];
  // const seizeTokens = log[key5];
  // }

  private borrow(log) {
    console.debug('function -> borrow');

    const [key1, key2, key3, key4] =
      MarketEventToOutput[MarketEventName.Borrow].split(',');

    // console.log('BORROWER', log[key1]);

    const cToken = log.address;
    const borrower = log[key1];
    const amount = log[key2];
    const accountBorrows = log[key3];
    const totalBorrows = log[key4];

    const market = this.storageService.getMarket(cToken);
    market.totalBorrows = totalBorrows;
    market.totalCash -= amount;

    const account = this.storageService.getAccount(borrower);

    if (!account) {
      throw new Error('Account not found');
    }

    // console.log(log.blockNumber);

    this.accountService.addBorrows(
      account,
      cToken,
      accountBorrows,
      market.borrowIndex,
    );
  }

  private repayBorrow(log) {
    console.debug('function -> repayBorrow');
    const [key1, key2, key3, key4, key5] =
      MarketEventToOutput[MarketEventName.RepayBorrow].split(',');

    const borrower = log[key2];
    const repayAmount = log[key3];
    const accountBorrows = log[key4];
    const totalBorrowsNew = log[key5];
    const cToken = log.address;

    const market = this.storageService.getMarket(cToken);
    const account = this.storageService.getAccount(borrower);
    if (!account) throw new Error('Account not found');
    const asset = account.assets.find(({ address }) => cToken === address);
    if (!asset) throw new Error('Asset not found');

    market.totalBorrows = totalBorrowsNew;
    market.totalCash += repayAmount;

    asset.principal = accountBorrows;
    asset.interestIndex = market.borrowIndex;
  }

  private reservesAdded(log) {
    console.debug('function -> reservesAdded');

    const [key1, key2] =
      MarketEventToOutput[MarketEventName.ReservesAdded].split(',');

    const addAmount = log[key1];
    const newTotalReserves = log[key2];

    const market = this.storageService.getMarket(log.address);

    market.totalReserves = newTotalReserves;
    market.totalCash += addAmount;
  }

  private reservesReduced(log) {
    console.debug('function -> reservesReduced');

    const [key1, key2] =
      MarketEventToOutput[MarketEventName.ReservesReduced].split(',');

    const reduceAmount = log[key1];
    const newTotalReserves = log[key2];

    const market = this.storageService.getMarket(log.address);

    market.totalReserves = newTotalReserves;
    market.totalCash -= reduceAmount;
  }

  fetchBorrowRateMantissa(cToken: string) {
    const { abi } = CToken;
    const borrowRateMantissaItem = getAbiItem(
      abi,
      'function',
      'borrowRatePerBlock',
    );
    return this.web3Service.callContractMethod({
      address: cToken,
      abi: borrowRateMantissaItem,
    });
  }

  async fetchMarketTotalReserves(cToken: string, blockNumber?: number) {
    const { abi } = CToken;
    const totalReservesItem = getAbiItem(abi, 'function', 'totalReserves');
    const totalReserves = await this.web3Service.callContractMethod({
      address: cToken,
      abi: totalReservesItem,
      blockNumber,
    });

    if (totalReserves === undefined) {
      throw new Error('Total reserves not found');
    }

    return totalReserves;
  }

  async fetchMarketTotalBorrows(cToken: string, blockNumber?: number) {
    const { abi } = CToken;
    const totalBorrowsItem = getAbiItem(abi, 'function', 'totalBorrows');
    const totalBorrows = await this.web3Service.callContractMethod({
      address: cToken,
      abi: totalBorrowsItem,
      blockNumber,
    });

    if (totalBorrows === undefined) {
      throw new Error('Total borrows not found');
    }

    return totalBorrows;
  }

  async fetchMarketBorrowIndex(cToken: string, blockNumber?: number) {
    const { abi } = CToken;
    const borrowIndexItem = getAbiItem(abi, 'function', 'borrowIndex');
    const borrowIndex = await this.web3Service.callContractMethod({
      address: cToken,
      abi: borrowIndexItem,
      blockNumber,
    });

    if (borrowIndex === undefined) {
      throw new Error('Borrow index not found');
    }

    return borrowIndex;
  }

  async collectLogs(fromBlock: number, toBlock: number) {
    console.debug('method -> collectMarketsLogs');

    const comptroller = this.storageService.getComptroller()!;
    const addresses = Array.from(comptroller.allMarkets);

    if (addresses.length === 0) {
      return [];
    }

    const eventNames = Object.values(MarketEventName);
    const abi = filterAbi(CErc20.abi, eventNames);

    const logs = await this.web3Service.getFilteredLogsByPieces(
      addresses,
      abi,
      eventNames,
      fromBlock,
      toBlock,
    );

    let decodedLogs = this.web3Service.decodeLogs(logs, abi);

    decodedLogs = sortLogs(decodedLogs);

    return decodedLogs;
  }

  // function defundAccountBalance(
  //   _account: AccountEntity,
  //   _cToken: string,
  //   _amount: bigint,
  // ) {
  //   const assetOrToken = findAssetOrToken(_account, _cToken);
  // }

  async fetchExchangeRate(cToken: string, blockNumber?: number) {
    const { abi } = CToken;
    const exchangeRateItem = getAbiItem(abi, 'function', 'exchangeRateStored');
    const exchangeRate = await this.web3Service.callContractMethod({
      address: cToken,
      abi: exchangeRateItem,
      blockNumber,
    });

    if (exchangeRate === undefined) {
      throw new Error('Exchange rate not found');
    }

    return exchangeRate;
  }

  async fetchCollateralFactor(cToken: string, blockNumber?: number) {
    const { abi } = CToken;
    const collateralFactorItem = getAbiItem(
      abi,
      'function',
      'collateralFactorMantissa',
    );
    const collateralFactor = await this.web3Service.callContractMethod({
      address: cToken,
      abi: collateralFactorItem,
      blockNumber,
    });

    if (collateralFactor === undefined) {
      throw new Error('Collateral factor not found');
    }

    return collateralFactor;
  }

  // async fetchMarketTotalCash(cToken: string, blockNumber?: number) {
  //   const { abi } = CToken;
  //   // const balanceOfAbiItem = getAbiItem(abi, 'function', 'balanceOf');
  //   const totalCashItem = getAbiItem(abi, 'function', 'getCash');
  //   const totalCash = await this.web3Service.callContractMethod({
  //     address: cToken,
  //     abi: balanceOfAbiItem,
  //     blockNumber,
  //   });
  //
  //   if (totalCash === undefined) {
  //     throw new Error('Total cash not found');
  //   }
  //
  //   return totalCash;
  // }
}
