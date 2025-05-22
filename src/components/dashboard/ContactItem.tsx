'use client';

import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ContactListItem } from '@/lib/api';
import { gsap } from 'gsap';

export function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface ContactItemProps {
  contact: ContactListItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function ContactItem({ contact, isSelected, onSelect }: ContactItemProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Add GSAP animation for hover effect
  useEffect(() => {
    if (!buttonRef.current) return;
    
    const button = buttonRef.current;
    
    // Hover effect
    const enterHandler = () => {
      if (isSelected) return; // Skip animation if already selected
      
      gsap.to(button, {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        scale: 1.01,
        duration: 0.2
      });
    };
    
    const leaveHandler = () => {
      if (isSelected) return; // Skip animation if already selected
      
      gsap.to(button, {
        backgroundColor: 'transparent',
        scale: 1,
        duration: 0.2
      });
    };
    
    button.addEventListener('mouseenter', enterHandler);
    button.addEventListener('mouseleave', leaveHandler);
    
    return () => {
      button.removeEventListener('mouseenter', enterHandler);
      button.removeEventListener('mouseleave', leaveHandler);
    };
  }, [isSelected]);
  
  // Add selection animation
  useEffect(() => {
    if (!buttonRef.current) return;
    
    if (isSelected) {
      gsap.fromTo(buttonRef.current,
        { 
          backgroundColor: 'rgba(255, 255, 255, 0.08)'
        }, 
        {
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          duration: 0.3,
          ease: "power1.inOut"
        }
      );
    } else {
      gsap.to(buttonRef.current, {
        backgroundColor: 'transparent',
        duration: 0.3,
        ease: "power1.out"
      });
    }
  }, [isSelected]);

  return (
    <button
      ref={buttonRef}
      className={cn(
        "w-full flex items-center p-3 rounded-lg transition-colors duration-200 mb-1",
        isSelected
          ? "bg-white/20 dark:bg-violet-900/30" 
          : "hover:bg-white/10 dark:hover:bg-gray-800/50"
      )}
      onClick={() => onSelect(contact.contact_id.toString())}
    >
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-violet-200 dark:bg-violet-900 flex items-center justify-center text-violet-700 dark:text-violet-300 text-base font-bold">
          {getInitials(contact.contact_full_name)}
        </div>
        <div className={cn(
          "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-violet-900 dark:border-gray-900",
          contact.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
        )}></div>
      </div>
      
      <div className="ml-3 flex-1 text-left overflow-hidden">
        <p className="text-white dark:text-white font-medium truncate">{contact.contact_full_name}</p>
        <p className="text-sm text-white/70 dark:text-gray-400 truncate">{contact.contact_mobile_number}</p>
      </div>
    </button>
  );
}
