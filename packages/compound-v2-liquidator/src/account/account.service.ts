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

  async getAccountTokenBalance(
    address: string,
    cToken: string,
    blockNumber?: number,
  ) {
    const { abi } = CToken;
    const balanceOfAbi = getAbiItem(abi, 'function', 'balanceOf');
    const balance = await this.web3Service.callContractMethod({
      abi: balanceOfAbi,
      address: cToken,
      args: [address],
      params: {},
      blockNumber,
    });

    return balance;
  }

  async fetchAccountLiquidity(address: string, blockNumber: number) {}

  async fetchAccountSnapshot(
    address: string,
    cToken: string,
    blockNumber: number,
  ) {
    const { abi } = CToken;
    const borrowSnapshotAbi = getAbiItem(abi, 'function', 'getAccountSnapshot');
    const borrowSnapshot = await this.web3Service.callContractMethod({
      abi: borrowSnapshotAbi,
      address: cToken,
      args: [address],
      params: {},
      blockNumber,
    });

    return borrowSnapshot;
  }

  addBorrows(
    account: AccountEntity,
    cToken: string,
    accountBorrows: bigint,
    borrowIndex: bigint,
  ) {
    console.debug('function -> addBorrows');

    // console.log(account);
    // console.log('cToken', cToken);
    const asset = findAsset(account, cToken);
    if (!asset) throw new Error('Asset not found');

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

  defundAccountBalance(
    _account: AccountEntity,
    _cToken: string,
    _amount: bigint,
  ) {
    console.debug('function -> defundAccountBalance');
    // console.log('account', _account);

    const balance = _account.tokens[_cToken];

    if (balance === undefined) {
      throw new Error('Token not found');
    }

    // console.log('token', token);
    // console.log('amount', _amount);

    _account.tokens[_cToken] -= _amount;

    if (_account.tokens[_cToken] < 0n) {
      throw new Error('Insufficient funds');
    }
  }

  createAccountWithToken(
    address: string,
    cTokenToFund?: string,
    fundAmount?: bigint,
  ) {
    console.log('function -> createAccountWithBalance');

    const newAccount: AccountEntity = {
      address,
      assets: [],
      tokens: {},
    };

    if (cTokenToFund && fundAmount) {
      newAccount.tokens[cTokenToFund] = fundAmount;
    }

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
  }

  enterMarket(account: AccountEntity, cToken: string) {
    const asset = findAsset(account, cToken);

    if (asset) {
      return;
    } else {
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
      throw new Error('Asset not found');
    }

    account.assets.splice(assetIndex, 1);
  }
}
