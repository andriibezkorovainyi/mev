export enum MarketEventName {
  Mint = 'Mint',
  Redeem = 'Redeem',
  Borrow = 'Borrow',
  RepayBorrow = 'RepayBorrow',
  AccrueInterest = 'AccrueInterest',
  ReservesAdded = 'ReservesAdded',
  ReservesReduced = 'ReservesReduced',
  NewReserveFactor = 'NewReserveFactor',
  Transfer = 'Transfer',
  // LiquidateBorrow = 'LiquidateBorrow',
}

export const MarketEventToOutput = {
  [MarketEventName.AccrueInterest]:
    'interestAccumulated,borrowIndex,totalBorrows,cashPrior',
  [MarketEventName.ReservesAdded]: 'addAmount,newTotalReserves',
  [MarketEventName.ReservesReduced]: 'reduceAmount,newTotalReserves',
  [MarketEventName.Transfer]: 'from,to,amount',
  [MarketEventName.Borrow]: 'borrower,borrowAmount,accountBorrows,totalBorrows',
  [MarketEventName.RepayBorrow]:
    'payer,borrower,repayAmount,accountBorrows,totalBorrows',
  // [MarketEventName.LiquidateBorrow]:
  //   'liquidator,borrower,repayAmount,cTokenCollateral,seizeTokens',
  [MarketEventName.Redeem]: 'redeemAmount,redeemTokens,redeemer',
  [MarketEventName.NewReserveFactor]: 'newReserveFactorMantissa',
  [MarketEventName.Mint]: 'minter,mintAmount,mintTokens',
};
