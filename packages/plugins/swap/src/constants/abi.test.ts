/**
 * ABI constants tests
 */


import {
  ERC20_ABI,
  PERMIT_SWAP_ABI,
  PERMIT2_TYPES,
  PERMIT2_WITNESS_TYPES,
  PERMIT2_DOMAIN_NAME,
} from './abi.js';

describe('ERC20_ABI', () => {
  it('should have balanceOf function', () => {
    const balanceOf = ERC20_ABI.find((item) => item.name === 'balanceOf');

    expect(balanceOf).toBeDefined();
    expect(balanceOf?.type).toBe('function');
    expect(balanceOf?.stateMutability).toBe('view');
    expect(balanceOf?.inputs).toHaveLength(1);
    expect(balanceOf?.inputs[0].type).toBe('address');
    expect(balanceOf?.outputs?.[0].type).toBe('uint256');
  });

  it('should have allowance function', () => {
    const allowance = ERC20_ABI.find((item) => item.name === 'allowance');

    expect(allowance).toBeDefined();
    expect(allowance?.type).toBe('function');
    expect(allowance?.stateMutability).toBe('view');
    expect(allowance?.inputs).toHaveLength(2);
    expect(allowance?.inputs[0].name).toBe('owner');
    expect(allowance?.inputs[1].name).toBe('spender');
    expect(allowance?.outputs?.[0].type).toBe('uint256');
  });

  it('should have approve function', () => {
    const approve = ERC20_ABI.find((item) => item.name === 'approve');

    expect(approve).toBeDefined();
    expect(approve?.type).toBe('function');
    expect(approve?.stateMutability).toBe('nonpayable');
    expect(approve?.inputs).toHaveLength(2);
    expect(approve?.inputs[0].name).toBe('spender');
    expect(approve?.inputs[1].name).toBe('amount');
    expect(approve?.outputs?.[0].type).toBe('bool');
  });

  it('should have decimals function', () => {
    const decimals = ERC20_ABI.find((item) => item.name === 'decimals');

    expect(decimals).toBeDefined();
    expect(decimals?.type).toBe('function');
    expect(decimals?.stateMutability).toBe('view');
    expect(decimals?.inputs).toHaveLength(0);
    expect(decimals?.outputs?.[0].type).toBe('uint8');
  });

  it('should have symbol function', () => {
    const symbol = ERC20_ABI.find((item) => item.name === 'symbol');

    expect(symbol).toBeDefined();
    expect(symbol?.type).toBe('function');
    expect(symbol?.stateMutability).toBe('view');
    expect(symbol?.outputs?.[0].type).toBe('string');
  });

  it('should have name function', () => {
    const name = ERC20_ABI.find((item) => item.name === 'name');

    expect(name).toBeDefined();
    expect(name?.type).toBe('function');
    expect(name?.stateMutability).toBe('view');
    expect(name?.outputs?.[0].type).toBe('string');
  });

  it('should have exactly 6 functions', () => {
    expect(ERC20_ABI.length).toBe(6);
  });
});

describe('PERMIT_SWAP_ABI', () => {
  it('should have permit2AndSwap function', () => {
    const permit2AndSwap = PERMIT_SWAP_ABI.find(
      (item) => item.name === 'permit2AndSwap',
    );

    expect(permit2AndSwap).toBeDefined();
    expect(permit2AndSwap?.type).toBe('function');
    expect(permit2AndSwap?.stateMutability).toBe('nonpayable');
  });

  it('should have permit parameter in permit2AndSwap', () => {
    const permit2AndSwap = PERMIT_SWAP_ABI.find(
      (item) => item.name === 'permit2AndSwap',
    );
    const permitInput = permit2AndSwap?.inputs.find(
      (input) => input.name === 'permit',
    );

    expect(permitInput).toBeDefined();
    expect(permitInput?.type).toBe('tuple');
  });

  it('should have signature parameter in permit2AndSwap', () => {
    const permit2AndSwap = PERMIT_SWAP_ABI.find(
      (item) => item.name === 'permit2AndSwap',
    );
    const signatureInput = permit2AndSwap?.inputs.find(
      (input) => input.name === 'signature',
    );

    expect(signatureInput).toBeDefined();
    expect(signatureInput?.type).toBe('bytes');
  });

  it('should have owner parameter in permit2AndSwap', () => {
    const permit2AndSwap = PERMIT_SWAP_ABI.find(
      (item) => item.name === 'permit2AndSwap',
    );
    const ownerInput = permit2AndSwap?.inputs.find(
      (input) => input.name === 'owner',
    );

    expect(ownerInput).toBeDefined();
    expect(ownerInput?.type).toBe('address');
  });

  it('should have swapData parameter in permit2AndSwap', () => {
    const permit2AndSwap = PERMIT_SWAP_ABI.find(
      (item) => item.name === 'permit2AndSwap',
    );
    const swapDataInput = permit2AndSwap?.inputs.find(
      (input) => input.name === 'swapData',
    );

    expect(swapDataInput).toBeDefined();
    expect(swapDataInput?.type).toBe('bytes');
  });

  it('should have rathExecutePermit2WithWitness function', () => {
    const rathExecute = PERMIT_SWAP_ABI.find(
      (item) => item.name === 'rathExecutePermit2WithWitness',
    );

    expect(rathExecute).toBeDefined();
    expect(rathExecute?.type).toBe('function');
    expect(rathExecute?.stateMutability).toBe('payable');
  });

  it('should have from parameter in rathExecutePermit2WithWitness', () => {
    const rathExecute = PERMIT_SWAP_ABI.find(
      (item) => item.name === 'rathExecutePermit2WithWitness',
    );
    const fromInput = rathExecute?.inputs.find(
      (input) => input.name === 'from',
    );

    expect(fromInput).toBeDefined();
    expect(fromInput?.type).toBe('address');
  });

  it('should have callData parameter in rathExecutePermit2WithWitness', () => {
    const rathExecute = PERMIT_SWAP_ABI.find(
      (item) => item.name === 'rathExecutePermit2WithWitness',
    );
    const callDataInput = rathExecute?.inputs.find(
      (input) => input.name === 'callData',
    );

    expect(callDataInput).toBeDefined();
    expect(callDataInput?.type).toBe('bytes');
  });

  it('should have exactly 2 functions', () => {
    expect(PERMIT_SWAP_ABI.length).toBe(2);
  });
});

describe('PERMIT2_TYPES', () => {
  it('should have PermitTransferFrom type', () => {
    expect(PERMIT2_TYPES.PermitTransferFrom).toBeDefined();
    expect(PERMIT2_TYPES.PermitTransferFrom).toBeInstanceOf(Array);
  });

  it('should have permitted field in PermitTransferFrom', () => {
    const permitted = PERMIT2_TYPES.PermitTransferFrom.find(
      (field) => field.name === 'permitted',
    );

    expect(permitted).toBeDefined();
    expect(permitted?.type).toBe('TokenPermissions');
  });

  it('should have spender field in PermitTransferFrom', () => {
    const spender = PERMIT2_TYPES.PermitTransferFrom.find(
      (field) => field.name === 'spender',
    );

    expect(spender).toBeDefined();
    expect(spender?.type).toBe('address');
  });

  it('should have nonce field in PermitTransferFrom', () => {
    const nonce = PERMIT2_TYPES.PermitTransferFrom.find(
      (field) => field.name === 'nonce',
    );

    expect(nonce).toBeDefined();
    expect(nonce?.type).toBe('uint256');
  });

  it('should have deadline field in PermitTransferFrom', () => {
    const deadline = PERMIT2_TYPES.PermitTransferFrom.find(
      (field) => field.name === 'deadline',
    );

    expect(deadline).toBeDefined();
    expect(deadline?.type).toBe('uint256');
  });

  it('should have TokenPermissions type', () => {
    expect(PERMIT2_TYPES.TokenPermissions).toBeDefined();
    expect(PERMIT2_TYPES.TokenPermissions).toBeInstanceOf(Array);
  });

  it('should have token field in TokenPermissions', () => {
    const token = PERMIT2_TYPES.TokenPermissions.find(
      (field) => field.name === 'token',
    );

    expect(token).toBeDefined();
    expect(token?.type).toBe('address');
  });

  it('should have amount field in TokenPermissions', () => {
    const amount = PERMIT2_TYPES.TokenPermissions.find(
      (field) => field.name === 'amount',
    );

    expect(amount).toBeDefined();
    expect(amount?.type).toBe('uint256');
  });
});

describe('PERMIT2_WITNESS_TYPES', () => {
  it('should have PermitWitnessTransferFrom type', () => {
    expect(PERMIT2_WITNESS_TYPES.PermitWitnessTransferFrom).toBeDefined();
  });

  it('should have witness field in PermitWitnessTransferFrom', () => {
    const witness = PERMIT2_WITNESS_TYPES.PermitWitnessTransferFrom.find(
      (field) => field.name === 'witness',
    );

    expect(witness).toBeDefined();
    expect(witness?.type).toBe('Payload');
  });

  it('should have Payload type', () => {
    expect(PERMIT2_WITNESS_TYPES.Payload).toBeDefined();
    expect(PERMIT2_WITNESS_TYPES.Payload).toBeInstanceOf(Array);
  });

  it('should have target field in Payload', () => {
    const target = PERMIT2_WITNESS_TYPES.Payload.find(
      (field) => field.name === 'target',
    );

    expect(target).toBeDefined();
    expect(target?.type).toBe('address');
  });

  it('should have callDataHash field in Payload', () => {
    const callDataHash = PERMIT2_WITNESS_TYPES.Payload.find(
      (field) => field.name === 'callDataHash',
    );

    expect(callDataHash).toBeDefined();
    expect(callDataHash?.type).toBe('bytes32');
  });

  it('should have TokenPermissions type', () => {
    expect(PERMIT2_WITNESS_TYPES.TokenPermissions).toBeDefined();
  });
});

describe('PERMIT2_DOMAIN_NAME', () => {
  it('should be Permit2', () => {
    expect(PERMIT2_DOMAIN_NAME).toBe('Permit2');
  });
});
