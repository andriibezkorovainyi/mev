export enum MarketEventName {
  Borrow = 'Borrow',
  RepayBorrow = 'RepayBorrow',
  AccrueInterest = 'AccrueInterest',
  ReservesAdded = 'ReservesAdded',
  ReservesReduced = 'ReservesReduced',
  NewReserveFactor = 'NewReserveFactor',
  Transfer = 'Transfer',
  // Mint = 'Mint',
  // Redeem = 'Redeem',
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
  [MarketEventName.NewReserveFactor]: 'newReserveFactorMantissa',
  // [MarketEventName.LiquidateBorrow]:
  //   'liquidator,borrower,repayAmount,cTokenCollateral,seizeTokens',
  // [MarketEventName.Redeem]: 'redeemAmount,redeemTokens,redeemer',
  // [MarketEventName.Mint]: 'minter,mintAmount,mintTokens',
};
