import { Service } from '../../utils/classes/service.ts';
import type { StorageService } from '../storage/storage.service.ts';
import type { Web3Service } from '../web3/web3.service.ts';
import type { AccountEntity } from './account.entity.ts';
import CToken from '../../../../common/compound-protocol/artifacts/CToken.sol/CToken.json';
import {
  findAsset,
  findIndexByAddr,
  getAbiItem,
} from '../../utils/helpers/array.helpers.ts';
import type { AccountAssetEntity } from './account-asset.entity.ts';

export class AccountService extends Service {
  constructor(
    private readonly storageService: StorageService,
    private readonly web3Service: Web3Service,
  ) {
    super();
  }

  async init() {
    // const result = await this.getAccountInMarketByBlock(
    //   '0x74cd2A5EA403cBc5BFAe354B3E02d10F644eeC2B',
    //   '0x35A18000230DA775CAc24873d00Ff85BccdeD550',
    //   19358579,
    // );
    // console.log(result);
  }

  async fetchAccountTokenBalance(
    address: string,
    cToken: string,
    blockNumber?: number,
  ) {
    const accountSnapshot = await this.fetchAccountSnapshot(
      address,
      cToken,
      blockNumber,
    );

    return accountSnapshot['1'];
  }

  async fetchAccountSnapshot(
    address: string,
    cToken: string,
    blockNumber?: number,
  ) {
    const { abi } = CToken;
    const borrowSnapshotAbi = getAbiItem(abi, 'function', 'getAccountSnapshot');
    const accountSnapshot = await this.web3Service.callContractMethod({
      abi: borrowSnapshotAbi,
      address: cToken,
      args: [address],
      params: {},
      blockNumber,
    });

    return accountSnapshot;
  }

  async fetchAccountBorrows(
    address: string,
    cToken: string,
    blockNumber: number,
  ) {
    const accountSnapshot = await this.fetchAccountSnapshot(
      address,
      cToken,
      blockNumber,
    );

    return accountSnapshot['2'];
  }

  addBorrows(
    account: AccountEntity,
    cToken: string,
    accountBorrows: bigint,
    borrowIndex: bigint,
  ) {
    console.debug('function -> addBorrows');

    // console.log(account);
    console.log('accountBorrows', accountBorrows);
    let asset = findAsset(account, cToken);

    if (!asset) {
      asset = {
        address: cToken,
        principal: 0n,
        interestIndex: 0n,
      };
      account.assets.push(asset);
    }

    asset.principal = accountBorrows;
    asset.interestIndex = borrowIndex;
  }

  fundAccountTokens(_account: AccountEntity, _cToken: string, _amount: bigint) {
    console.debug('function -> fundAccountBalance');
    const token = _account.tokens[_cToken];

    if (token) {
      _account.tokens[_cToken] += _amount;
    } else {
      _account.tokens[_cToken] = _amount;
    }
  }

  async defundAccountBalance(
    _account: AccountEntity,
    _cToken: string,
    _amount: bigint,
    log: any,
  ) {
    console.debug('function -> defundAccountBalance');
    // console.log('account', _account);

    const balance = _account.tokens[_cToken];

    // console.log(
    //   '_account',
    //   _account,
    //   '_cToken',
    //   _cToken,
    //   '_amount',
    //   _amount,
    //   'log',
    //   log,
    // );

    if (balance === undefined) {
      return;
    }

    // console.log('token', token);
    // console.log('amount', _amount);

    _account.tokens[_cToken] -= _amount;

    if (_account.tokens[_cToken] < 0n) {
      throw new Error('');
      // _account.tokens[_cToken] = await this.fetchAccountTokenBalance(
      //   _account.address,
      //   _cToken,
      //   log.blockNumber,
      // );
    }
  }

  createAccountWithToken(
    address: string,
    cTokenToFund: string,
    fundAmount: bigint,
  ) {
    console.log('function -> createAccountWithBalance');

    const newAccount: AccountEntity = {
      address,
      assets: [],
      tokens: {
        [cTokenToFund]: fundAmount || 0n,
      },
    };

    this.storageService.setAccount(address, newAccount);
  }

  createAccountWithAsset(address: string, cToken: string, balance?: bigint) {
    console.debug('function -> createAccountWithAsset');

    const newAccount: AccountEntity = {
      address,
      tokens: {
        [cToken]: balance || 0n,
      },
      assets: [
        {
          address: cToken,
          interestIndex: 0n,
          principal: 0n,
        },
      ],
    };

    this.storageService.setAccount(address, newAccount);

    return newAccount;
  }

  enterMarket(account: AccountEntity, cToken: string) {
    const asset = findAsset(account, cToken);
    const token = account.tokens[cToken];

    if (!token) {
      account.tokens[cToken] = 0n;
    }

    if (!asset) {
      account.assets.push({
        address: cToken,
        principal: 0n,
        interestIndex: 0n,
      });
    }
  }

  exitMarket(account: AccountEntity, cToken: string) {
    const assetIndex = findIndexByAddr(account.assets, cToken);

    if (assetIndex === -1) {
      return;
    }

    account.assets.splice(assetIndex, 1);
  }

  borrowBalance(asset: AccountAssetEntity, _borrowIndex?: bigint) {
    const { address, principal, interestIndex } = asset;

    const borrowIndex =
      _borrowIndex || this.storageService.getMarket(address).borrowIndex;

    if (principal === 0n) {
      return 0n;
    }

    return (principal * borrowIndex) / interestIndex;
  }
}
