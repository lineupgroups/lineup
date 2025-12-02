import React, { useState } from 'react';
import { ArrowLeft, CreditCard, Smartphone, Building, Check, Share2, Twitter, Facebook, MessageCircle, Lock, ShieldCheck } from 'lucide-react';
import { FirestoreProject } from '../types/firestore';

interface SupportFlowProps {
  project: FirestoreProject;
  onBack: () => void;
  onComplete: () => void;
}

export default function SupportFlow({ project, onBack, onComplete }: SupportFlowProps) {
  const [step, setStep] = useState<'amount' | 'payment' | 'confirmation'>('amount');
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedReward, setSelectedReward] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [isProcessing, setIsProcessing] = useState(false);

  const predefinedAmounts = [100, 500, 1000, 2500, 5000];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');

    // Auto-select reward tier if amount matches
    const matchingReward = project.rewards?.find(r => r.amount === amount);
    if (matchingReward) {
      setSelectedReward(matchingReward.id);
    } else {
      setSelectedReward(null);
    }
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      setSelectedAmount(numValue);
      // Check for matching reward
      const matchingReward = project.rewards?.find(r => r.amount === numValue);
      if (matchingReward) {
        setSelectedReward(matchingReward.id);
      } else {
        setSelectedReward(null);
      }
    } else {
      setSelectedAmount(0);
      setSelectedReward(null);
    }
  };

  const handleRewardSelect = (rewardId: string) => {
    const reward = project.rewards?.find(r => r.id === rewardId);
    if (reward) {
      setSelectedReward(rewardId);
      setSelectedAmount(reward.amount);
      setCustomAmount('');
    }
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsProcessing(false);
    setStep('confirmation');
  };

  const getCurrentAmount = () => {
    return customAmount ? parseInt(customAmount) || 0 : selectedAmount;
  };

  const selectedRewardData = selectedReward ? project.rewards?.find(r => r.id === selectedReward) : null;

  if (step === 'confirmation') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
          <p className="text-gray-600 mb-6">
            Your support of {formatCurrency(getCurrentAmount())} has been successfully processed.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3 mb-3">
              <img
                src={project.image}
                alt={project.title}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div className="text-left">
                <h3 className="font-medium text-gray-900">{project.title}</h3>
                <p className="text-sm text-gray-600">by Creator</p>
              </div>
            </div>

            {selectedRewardData && (
              <div className="border-t border-gray-200 pt-3">
                <p className="text-sm font-medium text-gray-900">{selectedRewardData.title}</p>
                <p className="text-sm text-gray-600">{selectedRewardData.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Est. delivery: {selectedRewardData.estimatedDelivery}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3 mb-6">
            <p className="text-sm text-gray-600 font-medium">Share this project:</p>
            <div className="flex justify-center space-x-3">
              <button className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                <Facebook className="w-5 h-5" />
              </button>
              <button className="p-3 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors">
                <Twitter className="w-5 h-5" />
              </button>
              <button className="p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                <MessageCircle className="w-5 h-5" />
              </button>
              <button className="p-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          <button
            onClick={onComplete}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200"
          >
            Continue Exploring
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-orange-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Project</span>
            </button>

            {/* Progress Indicator */}
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 ${step === 'amount' ? 'text-orange-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 'amount' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                  1
                </div>
                <span className="text-sm font-medium">Choose Amount</span>
              </div>
              <div className={`w-8 h-0.5 ${step === 'payment' ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
              <div className={`flex items-center space-x-2 ${step === 'payment' ? 'text-orange-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 'payment' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                  2
                </div>
                <span className="text-sm font-medium">Payment</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {step === 'amount' && (
              <div className="bg-white rounded-xl shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose Your Support Amount</h2>

                {/* Predefined Amounts */}
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Select</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {predefinedAmounts.map((amount) => (
                      <button
                        key={amount}
                        onClick={() => handleAmountSelect(amount)}
                        className={`p-4 border-2 rounded-lg text-center transition-all duration-200 ${selectedAmount === amount && !customAmount
                          ? 'border-orange-500 bg-orange-50 text-orange-600'
                          : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                          }`}
                      >
                        <div className="text-xl font-bold">{formatCurrency(amount)}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Amount */}
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Or Enter Custom Amount</h3>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-lg">₹</span>
                    </div>
                    <input
                      type="number"
                      value={customAmount}
                      onChange={(e) => handleCustomAmountChange(e.target.value)}
                      placeholder="Enter amount"
                      className="block w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg"
                    />
                  </div>
                </div>

                {/* Reward Tiers */}
                {project.rewards && project.rewards.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Available Rewards</h3>
                    <div className="space-y-3">
                      {project.rewards.map((reward) => (
                        <div
                          key={reward.id}
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${selectedReward === reward.id
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                            }`}
                          onClick={() => handleRewardSelect(reward.id)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900">{reward.title}</h4>
                            <span className="text-lg font-bold text-orange-600">
                              {formatCurrency(reward.amount)}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-2">{reward.description}</p>
                          <div className="flex justify-between items-center text-sm text-gray-500">
                            <span>Est. delivery: {reward.estimatedDelivery}</span>
                            <span>{reward.available - reward.claimed} remaining</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setStep('payment')}
                  disabled={getCurrentAmount() === 0}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold text-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Payment
                </button>
              </div>
            )}

            {step === 'payment' && (
              <div className="bg-white rounded-xl shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Details</h2>

                {/* Payment Methods */}
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Choose Payment Method</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      onClick={() => setPaymentMethod('upi')}
                      className={`p-4 border-2 rounded-lg flex flex-col items-center transition-all duration-200 ${paymentMethod === 'upi'
                        ? 'border-orange-500 bg-orange-50 text-orange-600'
                        : 'border-gray-200 hover:border-orange-300'
                        }`}
                    >
                      <Smartphone className="w-8 h-8 mb-2" />
                      <span className="font-medium">UPI</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('card')}
                      className={`p-4 border-2 rounded-lg flex flex-col items-center transition-all duration-200 ${paymentMethod === 'card'
                        ? 'border-orange-500 bg-orange-50 text-orange-600'
                        : 'border-gray-200 hover:border-orange-300'
                        }`}
                    >
                      <CreditCard className="w-8 h-8 mb-2" />
                      <span className="font-medium">Card</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('netbanking')}
                      className={`p-4 border-2 rounded-lg flex flex-col items-center transition-all duration-200 ${paymentMethod === 'netbanking'
                        ? 'border-orange-500 bg-orange-50 text-orange-600'
                        : 'border-gray-200 hover:border-orange-300'
                        }`}
                    >
                      <Building className="w-8 h-8 mb-2" />
                      <span className="font-medium">Net Banking</span>
                    </button>
                  </div>
                </div>

                {/* Payment Form */}
                <div className="mb-8">
                  {paymentMethod === 'upi' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">UPI ID</label>
                      <input
                        type="text"
                        placeholder="yourname@paytm"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                  )}

                  {paymentMethod === 'card' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                        <input
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Expiry</label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                          <input
                            type="text"
                            placeholder="123"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'netbanking' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Bank</label>
                      <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                        <option>State Bank of India</option>
                        <option>HDFC Bank</option>
                        <option>ICICI Bank</option>
                        <option>Axis Bank</option>
                        <option>Punjab National Bank</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => setStep('amount')}
                    className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-200 disabled:opacity-50"
                  >
                    {isProcessing ? 'Processing...' : `Pay ${formatCurrency(getCurrentAmount())}`}
                  </button>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Lock className="w-4 h-4 text-green-600" />
                    <span>Secure 256-bit SSL Encrypted</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>Lineup Guarantee</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Support Summary</h3>

                <div className="flex items-center space-x-3 mb-4">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">{project.title}</h4>
                    <p className="text-sm text-gray-600">by Creator</p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Support amount:</span>
                    <span className="font-semibold text-gray-900">
                      {getCurrentAmount() > 0 ? formatCurrency(getCurrentAmount()) : '—'}
                    </span>
                  </div>

                  {selectedRewardData && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                      <p className="font-medium text-orange-900 text-sm">{selectedRewardData.title}</p>
                      <p className="text-orange-700 text-xs">{selectedRewardData.description}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center font-semibold text-lg">
                    <span>Total:</span>
                    <span className="text-orange-600">
                      {getCurrentAmount() > 0 ? formatCurrency(getCurrentAmount()) : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}