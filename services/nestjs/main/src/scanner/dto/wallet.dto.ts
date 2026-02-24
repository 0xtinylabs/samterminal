import { GetWalletRequest, GetWalletResponse } from "@/proto-generated/wallet/messages";
import { AMOUNT } from "../utils";
import { Wallet } from "@/proto-generated/common/common";
import { GetTokenResponse, GetTokensResponse } from "@/proto-generated/token/messages";
import { TOKEN } from "../utils/web3";

export class WalletDTO {

    private walletData: Wallet;
    private nativeTokenPrice: number;

    constructor(walletData: Wallet, nativeTokenPrice: number) {
        this.walletData = walletData;
        this.nativeTokenPrice = nativeTokenPrice;
    }


    async getWalletData(): Promise<Wallet> {
        const response = { ...this.walletData }
        let totalDollarValue = parseFloat(response.totalDollarValue);

        response.nativeBalanceFormatted = AMOUNT.convert.bigintToFloat(response.nativeBalance, 18n).toString();

        totalDollarValue += AMOUNT.calculate.usd(response.nativeBalanceFormatted, this.nativeTokenPrice)
        response.totalDollarValue = totalDollarValue.toString();
        return response;
    }


}