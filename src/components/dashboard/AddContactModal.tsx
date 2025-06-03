'use client';

import React, { useState, useEffect, useRef } from 'react';
import { fetchAPI } from '@/lib/api';
import { cn } from '@/lib/utils';
import { ContactListItem } from '@/lib/api';

interface ContactSearchResult {
  user_id: number;
  first_name: string;
  last_name: string;
  mobile_number: string;
  status?: string;
  profile_picture?: string;
}

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddContact: (contactId: number) => Promise<boolean | void>;
  existingContacts?: ContactListItem[];
  currentUserId?: string | number;
  onContactAdded?: () => void;  
}

export default function AddContactModal({
  isOpen,
  onClose,
  onAddContact,
  existingContacts = [],
  currentUserId,
  onContactAdded
}: AddContactModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ContactSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<ContactSearchResult | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [addSuccess, setAddSuccess] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSearchResults([]);
      setIsLoading(false);
      setError(null);
      setSelectedContact(null);
      setAddSuccess(false);
      setShowConfirmation(false);
    
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchTerm.trim()) {
      setSearchResults([]);
      setError(null);
      return;
    }

    if (searchTerm.trim().length < 2) {
      return;
    }

    setIsLoading(true);
    
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setError(null);
        const results = await fetchAPI<ContactSearchResult[]>(
          `/api/search-contacts?search_data=${encodeURIComponent(searchTerm)}`, 
          {}, 
          true
        );
        
        const filteredResults = results.filter(result => {
          if (currentUserId !== undefined && 
              String(result.user_id) === String(currentUserId)) {
            return false;
          }
          
          const existingContact = existingContacts.find(contact => 
            contact.contact_id === result.user_id
          );
          
          if (!existingContact) {
            return true;
          } else if (existingContact.status?.toLowerCase() === 'pending') {
            // Make the check case-insensitive
            result.status = 'pending';
            console.log(`Contact ${result.first_name} ${result.last_name} is pending`);
            return true;
          }
          
          return false;
        });
        
        setSearchResults(filteredResults);
        
        if (filteredResults.length === 0) {
          if (results.length > 0) {
            if (results.length === 1 && String(results[0].user_id) === String(currentUserId)) {
              setError("You cannot add yourself as a contact.");
            } else {
              setError("These contacts are already in your contacts list.");
            }
          } else {
            setError("No contacts found. Try a different search term.");
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to search contacts');
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, existingContacts, currentUserId]);
  
  const handleContactSelect = (contact: ContactSearchResult) => {
    setSelectedContact(contact);
    setShowConfirmation(false);
  };
  
  const initiateAddContact = () => {
    if (!selectedContact) return;
    
    if (selectedContact.status === 'pending') {
      setAddSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
      return;
    }
    
    setShowConfirmation(true);
  };
  
  const handleAddContact = async () => {
    if (!selectedContact) return;
    
    setIsAdding(true);
    setError(null);
    
    try {
      await onAddContact(selectedContact.user_id);
      setAddSuccess(true);
      
      // Call onContactAdded to refresh contact lists in parent components
      if (onContactAdded) {
        onContactAdded();
      }
      
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add contact');
      setShowConfirmation(false);
      setIsAdding(false);
    }
  };

  const cancelAddContact = () => {
    setShowConfirmation(false);
  };

  const isPending = selectedContact?.status === 'pending';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden"
        style={{ animation: 'fadeIn 0.2s ease-out' }}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-violet-50 to-white dark:from-gray-800 dark:to-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <svg className="w-5 h-5 mr-2 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Add New Contact
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="px-4 py-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name or phone number..."
              className="w-full px-4 py-2.5 pl-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-violet-500 dark:focus:ring-violet-400 focus:border-violet-500 dark:focus:border-violet-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              ref={searchInputRef}
              autoFocus
            />
            <div className="absolute left-3 top-3 text-gray-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Notifications section */}
        <div className="px-4">
          {error && (
            <div className="mb-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-100 dark:border-red-800/30 flex items-start">
              <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {addSuccess && (
            <div className="mb-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm border border-green-100 dark:border-green-800/30 flex items-start">
              <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Contact request sent successfully!</span>
            </div>
          )}

          {searchTerm.length > 0 && searchTerm.length < 3 && (
            <div className="mb-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm border border-blue-100 dark:border-blue-800/30 flex items-start">
              <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Please enter at least 3 characters to search</span>
            </div>
          )}
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-hidden px-4">
          <div className="relative h-full">
            {/* Subtle top shadow for scroll indication */}
            <div className="absolute top-0 inset-x-0 h-4 bg-gradient-to-b from-white dark:from-gray-800 to-transparent z-10 pointer-events-none"></div>
            
            {/* Scrollable area */}
            <div className="h-full overflow-y-auto pb-4 pt-2 px-0.5 max-h-[40vh]">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                  <div className="animate-spin h-8 w-8 border-3 border-violet-500 border-t-transparent rounded-full"></div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Searching for users...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map((user) => (
                    <div key={user.user_id} className="p-3 rounded-lg transition-all duration-150 hover:bg-gray-50 dark:hover:bg-gray-700/30 border border-transparent">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            {user.profile_picture ? (
                              <img 
                                src={user.profile_picture} 
                                alt=""
                                className="w-11 h-11 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 dark:from-violet-600 dark:to-purple-700 flex items-center justify-center text-white text-base font-bold shadow-sm">
                                {(user.first_name?.[0] || '') + (user.last_name?.[0] || '')}
                              </div>
                            )}
                          </div>
                          <div className="ml-3">
                            <p className="font-medium text-gray-900 dark:text-gray-100">{user.first_name} {user.last_name}</p>
                            <div className="flex flex-col text-sm">
                              {user.mobile_number && (
                                <span className="text-gray-500 dark:text-gray-400">{user.mobile_number}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => setSelectedContact(user)}
                          className="ml-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchTerm.length >= 3 && !isLoading && !error ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    No users found matching "{searchTerm}"
                  </p>
                </div>
              ) : !searchTerm && !showConfirmation ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-4 text-violet-500 dark:text-violet-400">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-gray-800 dark:text-gray-200 font-medium mb-1">
                    Search for contacts
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm max-w-xs">
                    Search by name or phone number to find and add new contacts
                  </p>
                </div>
              ) : showConfirmation && addSuccess ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4 text-green-500 dark:text-green-400">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-gray-800 dark:text-gray-200 font-medium mb-1">
                    Request sent!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm max-w-xs">
                    The contact will be added to your list once they accept your request
                  </p>
                  <button
                    onClick={() => {
                      setShowConfirmation(false); 
                      setAddSuccess(false);
                    }}
                    className="mt-4 text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 text-sm"
                  >
                    Search for more
                  </button>
                </div>
              ) : null}
            </div>
            
            {/* Subtle bottom shadow for scroll indication */}
            <div className="absolute bottom-0 inset-x-0 h-4 bg-gradient-to-t from-white dark:from-gray-800 to-transparent z-10 pointer-events-none"></div>
          </div>
        </div>
        
        {selectedContact && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="text-center">
              <p className="mb-3 text-sm text-gray-700 dark:text-gray-300">
                Send contact request to <span className="font-semibold">{selectedContact.first_name} {selectedContact.last_name}</span>?
              </p>
              <div className="flex space-x-3 justify-center">
                <button
                  onClick={() => setSelectedContact(null)}
                  className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddContact}
                  disabled={isAdding}
                  className={`px-4 py-2 text-sm font-medium rounded-md bg-violet-600 hover:bg-violet-700 dark:bg-violet-700 dark:hover:bg-violet-600 text-white ${isAdding ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isAdding ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </div>
                  ) : "Send Request"}
                </button>
              </div>
            </div>
          </div>
        )}

        {!selectedContact && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium rounded-md"
            >
              Close
            </button>
          </div>
        )}

        <style jsx global>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.98); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    </div>
  );
}
