import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  CreditCard, 
  Smartphone, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Phone, 
  Wifi, 
  WifiOff, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Download, 
  History, 
  Shield, 
  Banknote, 
  Receipt, 
  QrCode, 
  MessageSquare, 
  Globe,
  Zap,
  Star
} from "lucide-react";
import { PaymentTransaction } from "@/types/enhanced-api";

interface PaymentIntegrationProps {
  farmerId: string;
  policyId?: string;
  claimId?: string;
  amount: number;
  currency: 'RWF' | 'USD';
  onPaymentSuccess: (transaction: PaymentTransaction) => void;
  onPaymentFailure: (error: string) => void;
}

interface USSDMenu {
  level: number;
  options: string[];
  currentInput: string;
  response: string;
}

export function PaymentIntegration({ 
  farmerId, 
  policyId, 
  claimId, 
  amount, 
  currency, 
  onPaymentSuccess, 
  onPaymentFailure 
}: PaymentIntegrationProps) {
  const [selectedMethod, setSelectedMethod] = useState<'mobile_money' | 'ussd' | 'bank_transfer' | 'card'>('mobile_money');
  const [selectedProvider, setSelectedProvider] = useState<'mtn' | 'airtel' | 'equity' | 'bk'>('mtn');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [ussdMenu, setUssdMenu] = useState<USSDMenu>({
    level: 0,
    options: [],
    currentInput: '',
    response: ''
  });

  // Mock data - in real implementation, this would come from API
  const paymentMethods = [
    {
      id: 'mobile_money',
      name: 'Mobile Money',
      icon: Smartphone,
      providers: [
        { id: 'mtn', name: 'MTN Mobile Money', color: 'bg-yellow-600', ussd: '*182*8#' },
        { id: 'airtel', name: 'Airtel Money', color: 'bg-red-600', ussd: '*182*7#' },
        { id: 'equity', name: 'Equity Mobile', color: 'bg-blue-600', ussd: '*247#' },
        { id: 'bk', name: 'BK Mobile', color: 'bg-green-600', ussd: '*182*6#' }
      ],
      description: 'Pay instantly using your mobile money account'
    },
    {
      id: 'ussd',
      name: 'USSD Code',
      icon: Phone,
      providers: [
        { id: 'mtn', name: 'MTN (*182*8#)', color: 'bg-yellow-600', ussd: '*182*8#' },
        { id: 'airtel', name: 'Airtel (*182*7#)', color: 'bg-red-600', ussd: '*182*7#' }
      ],
      description: 'Dial USSD code on your phone to make payment'
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      icon: Banknote,
      providers: [
        { id: 'equity', name: 'Equity Bank', color: 'bg-blue-600', ussd: '' },
        { id: 'bk', name: 'Bank of Kigali', color: 'bg-green-600', ussd: '' }
      ],
      description: 'Transfer directly from your bank account'
    },
    {
      id: 'card',
      name: 'Card Payment',
      icon: CreditCard,
      providers: [
        { id: 'visa', name: 'Visa/Mastercard', color: 'bg-blue-600', ussd: '' }
      ],
      description: 'Pay using your credit or debit card'
    }
  ];

  const recentTransactions: PaymentTransaction[] = [
    {
      id: "txn_001",
      farmerId: farmerId,
      policyId: "policy_001",
      transactionType: "premium_payment",
      amount: 120000,
      currency: "RWF",
      paymentMethod: "mobile_money",
      paymentProvider: "mtn",
      status: "completed",
      transactionId: "MTN123456789",
      reference: "POL001_PREM_2024",
      initiatedDate: "2024-03-15T10:30:00Z",
      completedDate: "2024-03-15T10:32:00Z"
    },
    {
      id: "txn_002",
      farmerId: farmerId,
      claimId: "claim_001",
      transactionType: "claim_payout",
      amount: 500000,
      currency: "RWF",
      paymentMethod: "mobile_money",
      paymentProvider: "airtel",
      status: "completed",
      transactionId: "ATL987654321",
      reference: "CLM001_PAYOUT_2024",
      initiatedDate: "2024-03-14T14:20:00Z",
      completedDate: "2024-03-14T14:22:00Z"
    }
  ];

  const handleMobileMoneyPayment = async () => {
    if (!phoneNumber) {
      onPaymentFailure('Phone number is required');
      return;
    }

    setIsProcessing(true);

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 3000));

    const transaction: PaymentTransaction = {
      id: `txn_${Date.now()}`,
      farmerId,
      policyId,
      claimId,
      transactionType: policyId ? 'premium_payment' : 'claim_payout',
      amount,
      currency,
      paymentMethod: 'mobile_money',
      paymentProvider: selectedProvider,
      status: 'completed',
      transactionId: `${selectedProvider.toUpperCase()}${Date.now()}`,
      reference: `${policyId || claimId}_${Date.now()}`,
      initiatedDate: new Date().toISOString(),
      completedDate: new Date().toISOString()
    };

    setIsProcessing(false);
    onPaymentSuccess(transaction);
  };

  const handleUSSDNavigation = (input: string) => {
    const newInput = ussdMenu.currentInput + input;
    const newLevel = ussdMenu.level + 1;

    let response = '';
    let options: string[] = [];

    switch (newLevel) {
      case 1:
        response = 'Welcome to Agricultural Insurance Payment\n1. Pay Premium\n2. Claim Payout\n3. Check Balance\n4. Exit';
        options = ['1', '2', '3', '4'];
        break;
      case 2:
        if (newInput.includes('1')) {
          response = 'Premium Payment\nEnter Amount: RWF ' + amount.toLocaleString() + '\n1. Confirm\n2. Cancel';
          options = ['1', '2'];
        } else if (newInput.includes('2')) {
          response = 'Claim Payout\nAmount: RWF ' + amount.toLocaleString() + '\n1. Confirm\n2. Cancel';
          options = ['1', '2'];
        }
        break;
      case 3:
        if (newInput.includes('1')) {
          response = 'Payment Successful!\nAmount: RWF ' + amount.toLocaleString() + '\nTransaction ID: ' + selectedProvider.toUpperCase() + Date.now() + '\nThank you!';
          // Complete payment
          setTimeout(() => {
            const transaction: PaymentTransaction = {
              id: `txn_${Date.now()}`,
              farmerId,
              policyId,
              claimId,
              transactionType: policyId ? 'premium_payment' : 'claim_payout',
              amount,
              currency,
              paymentMethod: 'ussd',
              paymentProvider: selectedProvider,
              status: 'completed',
              transactionId: `${selectedProvider.toUpperCase()}${Date.now()}`,
              reference: `${policyId || claimId}_${Date.now()}`,
              initiatedDate: new Date().toISOString(),
              completedDate: new Date().toISOString()
            };
            onPaymentSuccess(transaction);
          }, 2000);
        }
        break;
    }

    setUssdMenu({
      level: newLevel,
      options,
      currentInput: newInput,
      response
    });
  };

  const renderMobileMoneyPayment = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Smartphone className="h-5 w-5" />
            <span>Mobile Money Payment</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Provider Selection */}
          <div className="space-y-4">
            <Label>Select Mobile Money Provider</Label>
            <div className="grid grid-cols-2 gap-4">
              {paymentMethods.find(m => m.id === 'mobile_money')?.providers.map((provider) => (
                <div
                  key={provider.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedProvider === provider.id ? 'border-blue-500 bg-blue-50' : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedProvider(provider.id as any)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full ${provider.color} flex items-center justify-center`}>
                      <span className="text-white font-bold text-sm">
                        {provider.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{provider.name}</p>
                      <p className="text-sm text-gray-600">USSD: {provider.ussd}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              placeholder="+250 XXX XXX XXX"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <p className="text-sm text-gray-500">
              Enter the phone number linked to your {paymentMethods.find(m => m.id === 'mobile_money')?.providers.find(p => p.id === selectedProvider)?.name} account
            </p>
          </div>

          {/* Payment Summary */}
          <Card className="bg-blue-50">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold">{currency} {amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Provider:</span>
                  <span className="font-medium">
                    {paymentMethods.find(m => m.id === 'mobile_money')?.providers.find(p => p.id === selectedProvider)?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium">{phoneNumber || 'Not provided'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Button */}
          <Button
            onClick={handleMobileMoneyPayment}
            disabled={!phoneNumber || isProcessing}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Processing Payment...
              </>
            ) : (
              <>
                <DollarSign className="h-4 w-4 mr-2" />
                Pay {currency} {amount.toLocaleString()}
              </>
            )}
          </Button>

          {/* Security Notice */}
          <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
            <Shield className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-green-900">Secure Payment</h4>
              <p className="text-sm text-green-700 mt-1">
                Your payment is processed securely through {paymentMethods.find(m => m.id === 'mobile_money')?.providers.find(p => p.id === selectedProvider)?.name}. 
                We never store your payment credentials.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderUSSDPayment = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Phone className="h-5 w-5" />
            <span>USSD Payment</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* USSD Instructions */}
          <div className="space-y-4">
            <Label>USSD Payment Instructions</Label>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <p className="font-medium">Dial USSD Code</p>
                    <p className="text-sm text-gray-600">
                      {paymentMethods.find(m => m.id === 'ussd')?.providers.find(p => p.id === selectedProvider)?.ussd}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <p className="font-medium">Follow Menu Options</p>
                    <p className="text-sm text-gray-600">Select Agricultural Insurance and follow prompts</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <p className="font-medium">Enter Amount</p>
                    <p className="text-sm text-gray-600">Amount: {currency} {amount.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                  <div>
                    <p className="font-medium">Confirm Payment</p>
                    <p className="text-sm text-gray-600">Enter your PIN to complete transaction</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Provider Selection */}
          <div className="space-y-4">
            <Label>Select Provider</Label>
            <div className="grid grid-cols-1 gap-4">
              {paymentMethods.find(m => m.id === 'ussd')?.providers.map((provider) => (
                <div
                  key={provider.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedProvider === provider.id ? 'border-blue-500 bg-blue-50' : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedProvider(provider.id as any)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full ${provider.color} flex items-center justify-center`}>
                      <span className="text-white font-bold text-sm">
                        {provider.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{provider.name}</p>
                      <p className="text-sm text-gray-600">USSD Code: {provider.ussd}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* USSD Simulator */}
          <Card className="bg-black text-green-400">
            <CardHeader>
              <CardTitle className="text-green-400">USSD Simulator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="font-mono text-sm whitespace-pre-line min-h-[200px] p-4 bg-gray-900 rounded">
                {ussdMenu.response || 'Dial the USSD code to start payment process...'}
              </div>

              {ussdMenu.options.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {ussdMenu.options.map((option) => (
                    <Button
                      key={option}
                      variant="outline"
                      className="bg-gray-800 text-green-400 border-green-400 hover:bg-gray-700"
                      onClick={() => handleUSSDNavigation(option)}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              )}

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUssdMenu({
                    level: 0,
                    options: [],
                    currentInput: '',
                    response: 'Dial the USSD code to start payment process...'
                  })}
                  className="bg-gray-800 text-green-400 border-green-400 hover:bg-gray-700"
                >
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card className="bg-blue-50">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold">{currency} {amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">USSD Code:</span>
                  <span className="font-medium">
                    {paymentMethods.find(m => m.id === 'ussd')?.providers.find(p => p.id === selectedProvider)?.ussd}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );

  const renderTransactionHistory = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Recent Transactions</h3>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {recentTransactions.map((transaction) => (
        <Card key={transaction.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  transaction.status === 'completed' ? 'bg-green-100' :
                  transaction.status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'
                }`}>
                  {transaction.status === 'completed' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : transaction.status === 'pending' ? (
                    <Clock className="h-5 w-5 text-yellow-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium">
                    {transaction.transactionType === 'premium_payment' ? 'Premium Payment' : 'Claim Payout'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(transaction.completedDate || transaction.initiatedDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">{transaction.currency} {transaction.amount.toLocaleString()}</p>
                <div className="flex items-center space-x-2">
                  <Badge variant={
                    transaction.status === 'completed' ? 'default' :
                    transaction.status === 'pending' ? 'secondary' : 'destructive'
                  }>
                    {transaction.status.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {transaction.paymentProvider.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Transaction ID:</span>
                <span className="font-mono">{transaction.transactionId}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">Payment Gateway</CardTitle>
          <p className="text-center text-gray-600">
            Secure payment processing for agricultural insurance
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={selectedMethod} onValueChange={(value) => setSelectedMethod(value as any)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="mobile_money">Mobile Money</TabsTrigger>
              <TabsTrigger value="ussd">USSD</TabsTrigger>
              <TabsTrigger value="bank_transfer">Bank Transfer</TabsTrigger>
              <TabsTrigger value="card">Card</TabsTrigger>
            </TabsList>

            <TabsContent value="mobile_money" className="mt-6">
              {renderMobileMoneyPayment()}
            </TabsContent>

            <TabsContent value="ussd" className="mt-6">
              {renderUSSDPayment()}
            </TabsContent>

            <TabsContent value="bank_transfer" className="mt-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <Banknote className="h-12 w-12 mx-auto text-blue-600 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Bank Transfer</h3>
                  <p className="text-gray-600 mb-4">Direct bank transfer option coming soon</p>
                  <Button variant="outline" disabled>
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="card" className="mt-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <CreditCard className="h-12 w-12 mx-auto text-blue-600 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Card Payment</h3>
                  <p className="text-gray-600 mb-4">Credit/Debit card payment option coming soon</p>
                  <Button variant="outline" disabled>
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Transaction History */}
          <div className="mt-8">
            {renderTransactionHistory()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
