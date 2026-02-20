import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const ConfigurationPopup = ({ isOpen, onClose, contract, onSave }) => {
  const [email, setEmail] = useState('');
  const [selectedDays, setSelectedDays] = useState([]);
  const [errors, setErrors] = useState({});

  const dayOptions = [
    { value: 30, label: '30 Days' },
    { value: 60, label: '60 Days' },
    { value: 90, label: '90 Days' }
  ];

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex?.test(email);
  };

  const handleDayToggle = (day) => {
    setSelectedDays(prev => 
      prev?.includes(day) 
        ? prev?.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleSave = () => {
    const newErrors = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (selectedDays?.length === 0) {
      newErrors.days = 'Please select at least one alert period';
    }
    
    if (Object.keys(newErrors)?.length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onSave({
      email,
      alertDays: selectedDays,
      contractId: contract?.id,
      contractName: contract?.name
    });
    
    // Reset form
    setEmail('');
    setSelectedDays([]);
    setErrors({});
    onClose();
  };

  const handleClose = () => {
    setEmail('');
    setSelectedDays([]);
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={handleClose}
      />
      {/* Popup */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-card rounded-lg shadow-elevation-4 w-full max-w-md max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Contract Configuration</h2>
              <p className="text-sm text-text-secondary mt-1">{contract?.name}</p>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted transition-base"
            >
              <Icon name="X" size={20} className="text-text-secondary" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email Address for Alerts
              </label>
              <Input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => {
                  setEmail(e?.target?.value);
                  if (errors?.email) {
                    setErrors(prev => ({ ...prev, email: '' }));
                  }
                }}
                className={errors?.email ? 'border-destructive' : ''}
              />
              {errors?.email && (
                <p className="text-xs text-destructive mt-1">{errors?.email}</p>
              )}
            </div>
            
            {/* Alert Period Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Renewal Alert Period
              </label>
              <p className="text-xs text-text-secondary mb-3">
                Select when you want to receive renewal alerts before contract expiration
              </p>
              <div className="space-y-2">
                {dayOptions?.map((option) => (
                  <button
                    key={option?.value}
                    onClick={() => handleDayToggle(option?.value)}
                    className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-base ${
                      selectedDays?.includes(option?.value)
                        ? 'border-primary bg-primary/5' :'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-base ${
                        selectedDays?.includes(option?.value)
                          ? 'border-primary bg-primary' :'border-border'
                      }`}>
                        {selectedDays?.includes(option?.value) && (
                          <Icon name="Check" size={14} className="text-white" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-foreground">{option?.label}</span>
                    </div>
                    <Icon name="Bell" size={16} className="text-text-secondary" />
                  </button>
                ))}
              </div>
              {errors?.days && (
                <p className="text-xs text-destructive mt-2">{errors?.days}</p>
              )}
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-border">
            <Button
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
            >
              Save Configuration
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfigurationPopup;