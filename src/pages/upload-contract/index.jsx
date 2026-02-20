import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Header from '../../components/ui/Header';
import Breadcrumb from '../../components/ui/Breadcrumb';
import ContractForm from './components/ContractForm';
import FileUpload from './components/FileUpload';
import FormActions from './components/FormActions';
import { contractService, documentService } from '../../services/supabaseService';
import DynamicFieldRenderer from '../../components/DynamicFieldRenderer';

const UploadContract = () => {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [entryMethod, setEntryMethod] = useState('manual'); // 'manual' or 'upload'
  const [formData, setFormData] = useState({
    contractName: '',
    client: '',
    value: '',
    status: '',
    startDate: '',
    endDate: '',
    contractLength: '',
    remainingAmount: '',
    providerType: '',
  });
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [fileError, setFileError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [dynamicFields, setDynamicFields] = useState({});

  useEffect(() => {
    if (formData?.startDate && formData?.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      
      if (end >= start) {
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const years = Math.floor(diffDays / 365);
        const months = Math.floor((diffDays % 365) / 30);
        const days = diffDays % 30;
        
        let lengthStr = '';
        if (years > 0) lengthStr += `${years} year${years > 1 ? 's' : ''} `;
        if (months > 0) lengthStr += `${months} month${months > 1 ? 's' : ''} `;
        if (days > 0 || lengthStr === '') lengthStr += `${days} day${days !== 1 ? 's' : ''}`;
        
        setFormData(prev => ({ ...prev, contractLength: lengthStr?.trim() }));
      } else {
        setFormData(prev => ({ ...prev, contractLength: '' }));
        setErrors(prev => ({ ...prev, endDate: 'End date must be after start date' }));
      }
    }
  }, [formData?.startDate, formData?.endDate]);

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors?.[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileSelect = (selectedFile, error) => {
    setFile(selectedFile);
    setFileError(error || '');
  };

  const handleEntryMethodChange = (method) => {
    setEntryMethod(method);
    // Clear errors when switching methods
    setErrors({});
    setFileError('');
    setSaveError('');
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (entryMethod === 'manual') {
      // Validate manual entry fields
      if (!formData?.contractName?.trim()) {
        newErrors.contractName = 'Contract name is required';
      }
      
      if (!formData?.client) {
        newErrors.client = 'Client/Vendor is required';
      }
      
      if (!formData?.value || parseFloat(formData?.value) <= 0) {
        newErrors.value = 'Valid contract value is required';
      }
      
      if (!formData?.status) {
        newErrors.status = 'Status is required';
      }
      
      if (!formData?.startDate) {
        newErrors.startDate = 'Start date is required';
      }
      
      if (!formData?.endDate) {
        newErrors.endDate = 'End date is required';
      } else if (formData?.startDate && new Date(formData.endDate) < new Date(formData.startDate)) {
        newErrors.endDate = 'End date must be after start date';
      }
    } else if (entryMethod === 'upload') {
      // Validate file upload
      if (!file) {
        setFileError('Contract document is required');
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0 && (entryMethod === 'manual' || (file && !fileError));
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setSaveError('');

    try {
      if (entryMethod === 'manual') {
        // Save manual entry
        const contractData = {
          name: formData?.contractName,
          client: formData?.client,
          value: parseFloat(formData?.value),
          startDate: formData?.startDate,
          endDate: formData?.endDate,
          length: formData?.contractLength,
          remainingAmount: parseFloat(formData?.value),
          providerType: formData?.providerType || 'SaaS/Original Vendor'
        };

        await contractService?.create(contractData);
      } else if (entryMethod === 'upload') {
        // Save uploaded document
        // Create a minimal contract entry for the uploaded document
        const contractData = {
          name: file?.name?.replace(/\.[^/.]+$/, ''), // Use filename without extension as contract name
          client: 'Unknown', // Default value
          value: 0, // Default value
          startDate: new Date()?.toISOString()?.split('T')?.[0], // Today's dateendDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
          length: '1 year',remainingAmount: 0,providerType: 'SaaS/Original Vendor'
        };

        const newContract = await contractService?.create(contractData);

        // Attach the uploaded document
        await documentService?.create({
          contractId: newContract?.id,
          name: file?.name,
          size: file?.size,
          type: file?.type
        });
      }

      navigate('/contract-dashboard');
    } catch (err) {
      setSaveError(err?.message);
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = () => {
    if (entryMethod === 'manual') {
      return (formData?.contractName?.trim() &&
        formData?.client &&
        formData?.value &&
        parseFloat(formData?.value) > 0 &&
        formData?.status &&
        formData?.startDate &&
        formData?.endDate &&
        new Date(formData.endDate) >= new Date(formData.startDate));
    } else if (entryMethod === 'upload') {
      return file && !fileError;
    }
    return false;
  };

  return (
    <>
      <Helmet>
        <title>Upload Contract - ContractManager</title>
        <meta name="description" content="Add new contracts to the system with comprehensive data entry and file attachment capabilities" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-16">
          <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
            <Breadcrumb />
            
            <div className="mb-6 md:mb-8">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground mb-2">
                Upload Contract
              </h1>
              <p className="text-sm md:text-base text-text-secondary">
                Add a new contract to the system with all required details and documentation
              </p>
            </div>

            {saveError && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg">
                <p className="text-destructive text-sm">Error: {saveError}</p>
              </div>
            )}

            <div className="bg-card rounded-lg shadow-elevation-2 p-6 md:p-8">
              {/* Entry Method Selection */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-foreground mb-3">
                  Choose Entry Method
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => handleEntryMethodChange('manual')}
                    className={`flex-1 px-6 py-4 rounded-lg border-2 transition-base text-left ${
                      entryMethod === 'manual' ?'border-primary bg-primary/5' :'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        entryMethod === 'manual' ? 'border-primary' : 'border-border'
                      }`}>
                        {entryMethod === 'manual' && (
                          <div className="w-3 h-3 rounded-full bg-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Manual Entry</p>
                        <p className="text-sm text-text-secondary">Fill out contract details manually</p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleEntryMethodChange('upload')}
                    className={`flex-1 px-6 py-4 rounded-lg border-2 transition-base text-left ${
                      entryMethod === 'upload' ?'border-primary bg-primary/5' :'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        entryMethod === 'upload' ? 'border-primary' : 'border-border'
                      }`}>
                        {entryMethod === 'upload' && (
                          <div className="w-3 h-3 rounded-full bg-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Document Upload</p>
                        <p className="text-sm text-text-secondary">Upload contract document only</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="space-y-8">
                {entryMethod === 'manual' && (
                  <div>
                    <h2 className="text-lg md:text-xl font-semibold text-foreground mb-6">
                      Contract Information
                    </h2>
                    <ContractForm
                      formData={formData}
                      errors={errors}
                      onChange={handleFormChange}
                    />
                    <DynamicFieldRenderer
                      entityName="contracts"
                      entityId={null}
                      onFieldsChange={setDynamicFields}
                    />
                  </div>
                )}

                {entryMethod === 'upload' && (
                  <div>
                    <h2 className="text-lg md:text-xl font-semibold text-foreground mb-6">
                      Document Upload
                    </h2>
                    <FileUpload
                      file={file}
                      onFileSelect={handleFileSelect}
                      error={fileError}
                    />
                  </div>
                )}

                <FormActions
                  onSave={handleSave}
                  isSaving={isSaving}
                  isValid={isFormValid()}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default UploadContract;