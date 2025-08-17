# Creating a New Flow Testnet Account

Since we cannot use the existing testnet account due to key mismatch, here's how to create a new account:

## Option 1: Flow Testnet Faucet (Recommended)
1. Visit: https://testnet-faucet.onflow.org/
2. Click "Create Account"
3. Use this public key:
   ```
   90f9b035d844357a6896694931e855c9811847165dc8dddd05e5d2f30c6d5c92b4685384c38c93c38d6378a839b5193b247a5dbd160568742a080703d489ba97
   ```
4. The faucet will create an account and fund it with 1000 FLOW tokens

## Option 2: Manual Account Creation
If you have access to another funded testnet account, you can create an account using:
```bash
flow accounts create --network testnet \
  --key "90f9b035d844357a6896694931e855c9811847165dc8dddd05e5d2f30c6d5c92b4685384c38c93c38d6378a839b5193b247a5dbd160568742a080703d489ba97" \
  --signer <funded-account-name>
```

## Generated Key Details
- **Private Key** (saved as testnet-new.pkey): 
  ```
  00adb69bf401856290ff221c00bc505e3914c36e685b69c1dda8c54028550b53
  ```
- **Public Key**: 
  ```
  90f9b035d844357a6896694931e855c9811847165dc8dddd05e5d2f30c6d5c92b4685384c38c93c38d6378a839b5193b247a5dbd160568742a080703d489ba97
  ```
- **Signature Algorithm**: ECDSA_P256
- **Mnemonic** (backup phrase):
  ```
  brisk opera march you lady clarify sauce hurt culture lift earth enrich
  ```

## Next Steps
1. Create account via faucet
2. Update flow.json with new account address
3. Deploy all contracts
4. Run testnet demonstrations