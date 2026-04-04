declare module 'doku-nodejs-library';

type DokuSDK = {
  Snap: new (config: {
    isProduction: boolean;
    privateKey: string;
    clientID: string;
    publicKey: string;
    dokuPublicKey: string;
    secretKey: string;
  }) => {
    createVa(request: any): Promise<any>;
    updateVa(request: any): Promise<any>;
    deletePaymentCode(request: any): Promise<any>;
    checkStatusVa(request: any): Promise<any>;
    validateTokenB2B(token: string): boolean;
  }
}

export default DokuSDK;
