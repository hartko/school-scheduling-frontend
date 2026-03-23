'use client';
import React, { useRef, useState } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, X, FileSpreadsheet } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { downloadCSV } from '@/lib/utils';

interface MassUploadProps<T> {
  open: boolean;
  onClose: () => void;
  onUpload: (rows: T[]) => void;
  templateFields: string[];
  entityName: string;
  parseRow: (row: Record<string, string>) => T | null;
}

export function MassUpload<T>({ open, onClose, onUpload, templateFields, entityName, parseRow }: MassUploadProps<T>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<T[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');
  const [done, setDone] = useState(false);

  const reset = () => { setPreview([]); setErrors([]); setFileName(''); setDone(false); };
  const handleClose = () => { reset(); onClose(); };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    reset();
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const Papa = (await import('papaparse')).default;
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const errs: string[] = [];
        const rows: T[] = [];
        result.data.forEach((row, i) => {
          const parsed = parseRow(row);
          if (parsed) rows.push(parsed);
          else errs.push(`Row ${i + 2}: Invalid or missing required fields`);
        });
        setPreview(rows);
        setErrors(errs);
      },
    });

    if (inputRef.current) inputRef.current.value = '';
  };

  const handleSubmit = () => {
    if (!preview.length) return;
    onUpload(preview);
    setDone(true);
  };

  const downloadTemplate = () => {
    downloadCSV([Object.fromEntries(templateFields.map((f) => [f, '']))], `${entityName}-template.csv`);
  };

  return (
    <Modal open={open} onClose={handleClose} title={`Mass Upload — ${entityName}`} size="lg">
      <div className="space-y-4">
        {/* Template Download */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-ink-50 rounded-lg border border-ink-200">
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink-700">CSV Template</p>
            <p className="text-xs text-ink-400 mt-0.5 break-words">Fields: {templateFields.join(', ')}</p>
          </div>
          <Button variant="secondary" size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={downloadTemplate}>
            Template
          </Button>
        </div>

        {/* Upload Area */}
        {!done && (
          <div
            className="border-2 border-dashed border-ink-300 rounded-lg p-8 text-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors"
            onClick={() => inputRef.current?.click()}
          >
            <FileSpreadsheet className="w-10 h-10 text-ink-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-ink-700">{fileName || 'Click to upload CSV file'}</p>
            <p className="text-xs text-ink-400 mt-1">Supports .csv files</p>
            <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
          </div>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
            <p className="text-xs font-mono uppercase text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {errors.length} error{errors.length > 1 ? 's' : ''}
            </p>
            <ul className="text-xs text-red-500 space-y-0.5 max-h-24 overflow-y-auto">
              {errors.map((e, i) => <li key={i}>• {e}</li>)}
            </ul>
          </div>
        )}

        {/* Preview */}
        {preview.length > 0 && !done && (
          <div className="bg-jade/5 border border-jade/20 rounded-lg p-3">
            <p className="text-xs font-mono uppercase text-jade-dark flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> {preview.length} rows ready to import
            </p>
          </div>
        )}

        {/* Success */}
        {done && (
          <div className="text-center py-6">
            <CheckCircle className="w-12 h-12 text-jade mx-auto mb-3" />
            <p className="font-semibold text-ink-800">Import Complete</p>
            <p className="text-sm text-ink-500">{preview.length} records imported successfully.</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={handleClose} icon={<X className="w-3.5 h-3.5" />}>
            {done ? 'Close' : 'Cancel'}
          </Button>
          {!done && preview.length > 0 && (
            <Button onClick={handleSubmit} icon={<Upload className="w-3.5 h-3.5" />}>
              Import {preview.length} rows
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
