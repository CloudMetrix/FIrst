import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Header from '../../components/ui/Header';
import Breadcrumb from '../../components/ui/Breadcrumb';
import InvoiceForm from './components/InvoiceForm';
import InvoiceFileUpload from './components/InvoiceFileUpload';
import FormActions from './components/FormActions';
import Icon from '../../components/AppIcon';
import { contractService, invoiceService, storageService } from '../../services/supabaseService';
import { useAuth } from '../../contexts/AuthContext';

const UploadInvoice = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [entryMode, setEntryMode] = useState('upload');
  const [isSaving, setIsSaving] = useState(false);
  const [contracts, setContracts] = useState([]);
  const [loadingContracts, setLoadingContracts] = useState(true);
  const [formData, setFormData] = useState({
    contractId: '',
    invoiceNumber: '',
    invoiceDate: '',
    invoiceAmount: '',
    description: ''
  });
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [fileError, setFileError] = useState('');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    loadContracts();
  }, []);

  useEffect(() => {
    setErrors({});
    setFileError('');
    setSaveError('');
  }, [entryMode]);

  const loadContracts = async () => {
    try {
      setLoadingContracts(true);
      const data = await contractService?.getAll();
      const activeContracts = data?.filter(c => c?.status === 'Active' || c?.status === 'Pending');
      setContracts(activeContracts || []);
    } catch (err) {
      console.error('Error loading contracts:', err);
    } finally {
      setLoadingContracts(false);
    }
  };

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

  const validateForm = async () => {
    const newErrors = {};

    if (!formData?.contractId) {
      newErrors.contractId = 'Contract selection is required';
    }

    if (!formData?.invoiceNumber?.trim()) {
      newErrors.invoiceNumber = 'Invoice number is required';
    } else if (formData?.contractId) {
      const isDuplicate = await invoiceService?.checkDuplicateInvoiceNumber(formData?.invoiceNumber, formData?.contractId);
      if (isDuplicate) {
        newErrors.invoiceNumber = 'Invoice number already exists';
      }
    }

    if (!formData?.invoiceDate) {
      newErrors.invoiceDate = 'Invoice date is required';
    }

    if (!formData?.invoiceAmount || parseFloat(formData?.invoiceAmount) <= 0) {
      newErrors.invoiceAmount = 'Valid invoice amount is required';
    }

    if (entryMode === 'upload' && !file) {
      setFileError('Invoice document is required for upload mode');
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0 && (entryMode === 'manual' || (file && !fileError));
  };

  const handleSave = async () => {
    const isValid = await validateForm();
    if (!isValid) {
      return;
    }

    setIsSaving(true);
    setSaveError('');

    try {
      let uploadResult = null;

      if (file) {
        uploadResult = await storageService?.uploadInvoiceDocument(
          file,
          user?.id,
          formData?.invoiceNumber
        );
      }

      const invoiceData = {
        contractId: formData?.contractId,
        invoiceNumber: formData?.invoiceNumber,
        date: formData?.invoiceDate,
        amount: parseFloat(formData?.invoiceAmount),
        description: formData?.description || null,
        filePath: uploadResult?.filePath || null,
        fileName: uploadResult?.fileName || null,
        fileSize: uploadResult?.fileSize || null,
        status: 'Pending'
      };

      await invoiceService?.create(invoiceData);
      navigate('/invoice-listing');
    } catch (err) {
      setSaveError(err?.message || 'Failed to save invoice');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const isFormValid = () => {
    const baseValid = (
      formData?.contractId &&
      formData?.invoiceNumber?.trim() &&
      formData?.invoiceDate &&
      formData?.invoiceAmount &&
      parseFloat(formData?.invoiceAmount) > 0
    );

    if (entryMode === 'upload') {
      return baseValid && file && !fileError;
    }

    return baseValid;
  };

  return (
    <>
      <Helmet>
        <title>Upload Invoice - ContractManager</title>
        <meta name="description" content="Upload invoice documents or manually enter invoice details for existing contracts" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="pt-16">
          <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
            <Breadcrumb />

            <div className="mb-6 md:mb-8">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground mb-2">
                Add Invoice
              </h1>
              <p className="text-sm md:text-base text-text-secondary">
                Choose to upload a document or manually enter invoice details
              </p>
            </div>

            {saveError && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg">
                <p className="text-destructive text-sm">Error: {saveError}</p>
              </div>
            )}

            <div className="bg-card rounded-lg shadow-elevation-2 p-6 md:p-8">
              <div className="mb-8">
                <label className="block text-sm font-medium text-foreground mb-3">
                  Select Entry Method
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setEntryMode('upload')}
                    className={`p-6 border-2 rounded-lg transition-base text-left ${
                      entryMode === 'upload' ?'border-primary bg-primary/5' :'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        entryMode === 'upload' ? 'bg-primary/20' : 'bg-muted'
                      }`}>
                        <Icon name="Upload" size={24} color={entryMode === 'upload' ? 'var(--color-primary)' : 'var(--color-text-secondary)'} />
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-base font-semibold mb-1 ${
                          entryMode === 'upload' ? 'text-primary' : 'text-foreground'
                        }`}>
                          Upload Document
                        </h3>
                        <p className="text-sm text-text-secondary">
                          Upload an invoice file with metadata
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEntryMode('manual')}
                    className={`p-6 border-2 rounded-lg transition-base text-left ${
                      entryMode === 'manual' ?'border-primary bg-primary/5' :'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        entryMode === 'manual' ? 'bg-primary/20' : 'bg-muted'
                      }`}>
                        <Icon name="Edit" size={24} color={entryMode === 'manual' ? 'var(--color-primary)' : 'var(--color-text-secondary)'} />
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-base font-semibold mb-1 ${
                          entryMode === 'manual' ? 'text-primary' : 'text-foreground'
                        }`}>
                          Manual Entry
                        </h3>
                        <p className="text-sm text-text-secondary">
                          Enter invoice details manually without a file
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="border-t border-border pt-8">
                {entryMode === 'upload' ? (
                  <>
                    <div className="mb-8">
                      <InvoiceFileUpload
                        file={file}
                        onFileSelect={handleFileSelect}
                        error={fileError}
                        invoiceNumber={formData?.invoiceNumber}
                      />
                    </div>

                    <div className="border-t border-border pt-8">
                      <h2 className="text-lg font-semibold text-foreground mb-6">
                        Invoice Details
                      </h2>
                      <InvoiceForm
                        formData={formData}
                        contracts={contracts}
                        loadingContracts={loadingContracts}
                        errors={errors}
                        onChange={handleFormChange}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <InvoiceForm
                      formData={formData}
                      contracts={contracts}
                      loadingContracts={loadingContracts}
                      errors={errors}
                      onChange={handleFormChange}
                    />

                    <div className="mt-8 p-4 bg-muted/50 border border-border rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Icon name="Info" size={20} color="var(--color-text-secondary)" className="flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-text-secondary">
                          You can optionally attach a document later by editing this invoice
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <FormActions
                onSave={handleSave}
                onCancel={handleCancel}
                isSaving={isSaving}
                isValid={isFormValid()}
              />
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default UploadInvoice;