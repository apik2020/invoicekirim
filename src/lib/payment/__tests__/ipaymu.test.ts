import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createHmac, createHash } from 'crypto'

// Set env vars before importing the module
process.env.IPAYMU_VA = 'test_va_123'
process.env.IPAYMU_API_KEY = 'test_api_key_456'
process.env.IPAYMU_MODE = 'SANDBOX'

import { IPaymuGateway, mapBankCodeToIpaymu, IPAYMU_VA_BANKS, IPAYMU_QRIS } from '../ipaymu'
import type { CallbackPayload } from '../types'

describe('IPaymuGateway', () => {
  let gateway: IPaymuGateway

  beforeEach(() => {
    gateway = new IPaymuGateway()
    vi.restoreAllMocks()
  })

  describe('name', () => {
    it('returns "iPaymu"', () => {
      expect(gateway.name).toBe('iPaymu')
    })
  })

  describe('getAvailablePaymentMethods', () => {
    it('returns VA banks and QRIS', () => {
      const methods = gateway.getAvailablePaymentMethods()
      expect(methods.length).toBeGreaterThan(0)
      expect(methods.some(m => m.type === 'VA')).toBe(true)
      expect(methods.some(m => m.type === 'QRIS')).toBe(true)
    })
  })

  describe('verifyCallback', () => {
    it('validates a correct signature', () => {
      const payload: CallbackPayload = {
        trx_id: 'TX123',
        reference_id: 'INV-123',
        status: 'berhasil',
        status_code: 1,
        total: 100000,
        fee: 5000,
        via: 'VA',
        channel: 'BCA',
      }

      // Generate expected signature
      const dataToSign = { ...payload }
      // No signature field to remove yet
      const sortedData: Record<string, unknown> = {}
      Object.keys(dataToSign).sort().forEach(key => {
        sortedData[key] = dataToSign[key]
      })
      const expectedSig = createHmac('sha256', process.env.IPAYMU_VA!)
        .update(JSON.stringify(sortedData))
        .digest('hex')

      const payloadWithSig = { ...payload, signature: expectedSig }

      const result = gateway.verifyCallback(payloadWithSig)
      expect(result.isValid).toBe(true)
      expect(result.orderId).toBe('INV-123')
      expect(result.status).toBe('COMPLETED')
      expect(result.transactionId).toBe('TX123')
    })

    it('rejects an invalid signature', () => {
      const payload: CallbackPayload = {
        trx_id: 'TX123',
        reference_id: 'INV-123',
        status: 'berhasil',
        status_code: 1,
        total: 100000,
        signature: 'invalid_signature',
      }

      const result = gateway.verifyCallback(payload)
      expect(result.isValid).toBe(false)
    })

    it('maps status_code 1 to COMPLETED', () => {
      const payload: CallbackPayload = {
        reference_id: 'INV-123',
        status_code: 1,
      }
      const sortedData: Record<string, unknown> = {}
      Object.keys(payload).sort().forEach(key => {
        sortedData[key] = payload[key]
      })
      const sig = createHmac('sha256', process.env.IPAYMU_VA!)
        .update(JSON.stringify(sortedData))
        .digest('hex')

      const result = gateway.verifyCallback({ ...payload, signature: sig })
      expect(result.status).toBe('COMPLETED')
    })

    it('maps status_code 0 to PENDING', () => {
      const payload: CallbackPayload = {
        reference_id: 'INV-123',
        status_code: 0,
      }
      // Generate valid signature
      const sortedData: Record<string, unknown> = {}
      Object.keys(payload).sort().forEach(key => {
        sortedData[key] = payload[key]
      })
      const sig = createHmac('sha256', process.env.IPAYMU_VA!)
        .update(JSON.stringify(sortedData))
        .digest('hex')

      const result = gateway.verifyCallback({ ...payload, signature: sig })
      expect(result.status).toBe('PENDING')
    })

    it('maps status_code -2 to EXPIRED', () => {
      const payload: CallbackPayload = {
        reference_id: 'INV-123',
        status_code: -2,
      }
      const sortedData: Record<string, unknown> = {}
      Object.keys(payload).sort().forEach(key => {
        sortedData[key] = payload[key]
      })
      const sig = createHmac('sha256', process.env.IPAYMU_VA!)
        .update(JSON.stringify(sortedData))
        .digest('hex')

      const result = gateway.verifyCallback({ ...payload, signature: sig })
      expect(result.status).toBe('EXPIRED')
    })
  })

  describe('createTransaction', () => {
    it('creates a VA payment', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          Status: 200,
          SessionId: 'session_abc',
          TransactionId: 'tx_123',
          PaymentNo: '8812345678901234',
          Total: '105000',
          Fee: '5000',
          Expired: '24',
        }),
      }

      vi.spyOn(global, 'fetch').mockResolvedValueOnce(mockResponse as any)

      const result = await gateway.createTransaction({
        orderId: 'INV-TEST-001',
        amount: 100000,
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        description: 'Test payment',
        paymentMethod: 'VA',
        paymentChannel: 'BCA',
      })

      expect(result.orderId).toBe('INV-TEST-001')
      expect(result.sessionId).toBe('session_abc')
      expect(result.transactionId).toBe('tx_123')
      expect(result.vaNumber).toBe('8812345678901234')
      expect(result.vaBank).toBe('BCA')
      expect(result.status).toBe('PENDING')
      expect(result.fee).toBe(5000)

      // Verify fetch was called with correct endpoint
      expect(fetch).toHaveBeenCalledTimes(1)
      const [url] = (fetch as any).mock.calls[0]
      expect(url).toContain('/api/v2/payment/direct')
    })

    it('creates a QRIS payment', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          Status: 200,
          SessionId: 'session_qris',
          TransactionId: 'tx_qris_123',
          QrString: 'qr_string_data',
          QrImage: 'https://example.com/qr.png',
          Total: '105000',
          Fee: '5000',
          Expired: '1',
        }),
      }

      vi.spyOn(global, 'fetch').mockResolvedValueOnce(mockResponse as any)

      const result = await gateway.createTransaction({
        orderId: 'INV-QRIS-001',
        amount: 100000,
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        description: 'Test QRIS',
        paymentMethod: 'QRIS',
      })

      expect(result.orderId).toBe('INV-QRIS-001')
      expect(result.qrString).toBe('qr_string_data')
      expect(result.qrImageUrl).toBe('https://example.com/qr.png')
      expect(result.status).toBe('PENDING')
    })

    it('throws on API error', async () => {
      const mockResponse = {
        ok: false,
        json: () => Promise.resolve({
          Message: 'Invalid credentials',
        }),
      }

      vi.spyOn(global, 'fetch').mockResolvedValueOnce(mockResponse as any)

      await expect(
        gateway.createTransaction({
          orderId: 'INV-ERR',
          amount: 100000,
          customerName: 'Test',
          customerEmail: 'test@example.com',
          description: 'Error test',
          paymentMethod: 'VA',
          paymentChannel: 'BCA',
        })
      ).rejects.toThrow('iPaymu API error')
    })
  })

  describe('createRedirectTransaction', () => {
    it('creates a redirect payment and returns paymentUrl', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          Status: 200,
          Data: {
            SessionID: 'session_redirect_123',
            Url: 'https://sandbox.ipaymu.com/payment/abc123',
          },
        }),
      }

      vi.spyOn(global, 'fetch').mockResolvedValueOnce(mockResponse as any)

      const result = await gateway.createRedirectTransaction({
        orderId: 'INV-REDIRECT-001',
        amount: 50000,
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
        description: 'Test redirect',
      })

      expect(result.orderId).toBe('INV-REDIRECT-001')
      expect(result.paymentUrl).toBe('https://sandbox.ipaymu.com/payment/abc123')
      expect(result.sessionId).toBe('session_redirect_123')
      expect(result.status).toBe('PENDING')
      expect(result.expiredAt).toBeInstanceOf(Date)

      expect(fetch).toHaveBeenCalledTimes(1)
      const [url, options] = (fetch as any).mock.calls[0]
      expect(url).toContain('/api/v2/payment')
      expect(url).not.toContain('/api/v2/payment/direct')

      const sentBody = JSON.parse(options.body)
      expect(sentBody.paymentMethod).toBeUndefined()
      expect(sentBody.paymentChannel).toBeUndefined()
      expect(sentBody.account).toBe('test_va_123')
      expect(sentBody.returnUrl).toContain('reference_id=INV-REDIRECT-001')
      expect(sentBody.successUrl).toBeUndefined()
    })

    it('throws when no payment URL returned', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          Status: 200,
          Data: {},
        }),
      }

      vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse as any)

      await expect(
        gateway.createRedirectTransaction({
          orderId: 'INV-NOURL',
          amount: 10000,
          customerName: 'Test',
          customerEmail: 'test@example.com',
          description: 'No URL test',
        })
      ).rejects.toThrow('did not return a payment URL')
    })
  })

  describe('checkTransactionStatus', () => {
    it('returns COMPLETED for Data.Status 1 (production format)', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          Status: 200,
          Success: true,
          Message: 'success',
          Data: {
            TransactionId: 207136,
            SessionId: 'session-abc',
            ReferenceId: 'INV-TEST-001',
            SubTotal: 100000,
            Amount: 100000,
            Status: 1,
            StatusDesc: 'Berhasil',
            PaidStatus: 'paid',
            PaymentMethod: 'va',
            PaymentChannel: 'bsi',
          },
        }),
      }

      vi.spyOn(global, 'fetch').mockResolvedValueOnce(mockResponse as any)

      const result = await gateway.checkTransactionStatus('207136')
      expect(result.status).toBe('COMPLETED')
      expect(result.amount).toBe(100000)
      expect(result.reference).toBe('INV-TEST-001')
      expect(result.transactionId).toBe('207136')
      expect(result.paymentMethod).toBe('va')
      expect(result.paymentChannel).toBe('bsi')
    })

    it('returns COMPLETED for flat status_code 1 (callback format)', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          status_code: 1,
          total: '100000',
          trx_id: 'TX123',
          via: 'VA',
        }),
      }

      vi.spyOn(global, 'fetch').mockResolvedValueOnce(mockResponse as any)

      const result = await gateway.checkTransactionStatus('TX123')
      expect(result.status).toBe('COMPLETED')
      expect(result.amount).toBe(100000)
      expect(result.reference).toBe('TX123')
    })

    it('returns PENDING for status_code 0', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          status_code: 0,
          total: '100000',
          trx_id: 'TX456',
        }),
      }

      vi.spyOn(global, 'fetch').mockResolvedValueOnce(mockResponse as any)

      const result = await gateway.checkTransactionStatus('TX456')
      expect(result.status).toBe('PENDING')
    })

    it('returns EXPIRED for status_code -2', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          status_code: -2,
          total: '100000',
          trx_id: 'TX789',
        }),
      }

      vi.spyOn(global, 'fetch').mockResolvedValueOnce(mockResponse as any)

      const result = await gateway.checkTransactionStatus('TX789')
      expect(result.status).toBe('EXPIRED')
    })
  })
})

describe('mapBankCodeToIpaymu', () => {
  it('maps common bank names', () => {
    expect(mapBankCodeToIpaymu('BCA')).toBe('bca')
    expect(mapBankCodeToIpaymu('BNI')).toBe('bni')
    expect(mapBankCodeToIpaymu('BRI')).toBe('bri')
    expect(mapBankCodeToIpaymu('MANDIRI')).toBe('mandiri')
    expect(mapBankCodeToIpaymu('PERMATA')).toBe('permata')
    expect(mapBankCodeToIpaymu('CIMB')).toBe('cimb')
    expect(mapBankCodeToIpaymu('BSI')).toBe('bsi')
  })

  it('handles case insensitive input', () => {
    expect(mapBankCodeToIpaymu('bca')).toBe('bca')
    expect(mapBankCodeToIpaymu('Bca')).toBe('bca')
  })

  it('passes through unknown codes in lowercase', () => {
    expect(mapBankCodeToIpaymu('UNKNOWN')).toBe('unknown')
  })
})

describe('IPAYMU constants', () => {
  it('has VA banks with required fields', () => {
    for (const bank of IPAYMU_VA_BANKS) {
      expect(bank.code).toBeTruthy()
      expect(bank.name).toBeTruthy()
      expect(bank.type).toBe('VA')
    }
  })

  it('has QRIS with required fields', () => {
    expect(IPAYMU_QRIS.code).toBe('qris')
    expect(IPAYMU_QRIS.type).toBe('QRIS')
  })
})
