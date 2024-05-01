import MasterModule from '../src/master/master.module.ts';

async function updateAccountTokenBalance(): Promise<void> {
  const masterModule = new MasterModule(undefined);
  const accountService =
    masterModule.accountModule.getService('accountService');
  const storageService =
    masterModule.storageModule.getService('storageService');
  await storageService.init();

  const pointerHeight = storageService.getPointerHeight();
  const account = storageService.getAccount(
    '0xFeECA8db8b5f4Efdb16BA43d3D06ad2F568a52E3',
  );

  console.log('Account:', account);
  const cToken = '0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5';

  const fetchedBalance = await accountService.fetchAccountTokenBalance(
    account?.address!,
    cToken,
    pointerHeight,
  );

  account!.tokens[cToken] = fetchedBalance;

  await storageService.cacheAccounts();

  console.log('Account token balance updated successfully!');
}

updateAccountTokenBalance();
