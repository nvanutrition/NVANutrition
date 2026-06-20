'use client';

import Link from 'next/link';
import { Facebook, Instagram, Linkedin, Twitter, Mail, Phone, MapPin, Sun, Moon } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export function Footer() {
  return (
  <footer className="bg-muted/50 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] mt-20 pt-14 pb-8">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
 {/* Brand */}
 <div className="md:col-span-1">
 <Image src="/logo.png" alt="NVA Nutrition" width={200} height={80} className="w-auto h-14 mb-4 object-contain" />
 <p className="text-muted-foreground text-sm leading-relaxed">Fuel Your Performance. Transform Your Body. Premium sports nutrition for champions.</p>
 <div className="flex gap-2 mt-5">
 <a href="https://instagram.com/nva_nutrition" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-9 h-9 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-pink-400 hover:border-pink-400/30 hover:bg-pink-400/5 transition">
 <Instagram className="w-4 h-4" />
 </a>
 <a href="#" aria-label="Facebook" className="w-9 h-9 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-blue-400 hover:border-blue-400/30 hover:bg-blue-400/5 transition">
 <Facebook className="w-4 h-4" />
 </a>
 <a href="#" aria-label="Twitter" className="w-9 h-9 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-sky-400 hover:border-sky-400/30 hover:bg-sky-400/5 transition">
 <Twitter className="w-4 h-4" />
 </a>
 <a href="#" aria-label="LinkedIn" className="w-9 h-9 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-blue-500 hover:border-blue-500/30 hover:bg-blue-500/5 transition">
 <Linkedin className="w-4 h-4" />
 </a>
 </div>
 </div>

 {/* Quick Links */}
 <div>
 <h3 className="font-bold text-foreground mb-5 text-sm uppercase tracking-wider">Quick Links</h3>
 <ul className="space-y-2.5">
 {[
 { href: '/', label: 'Home' },
 { href: '/products', label: 'Products' },
 { href: '/about', label: 'About Us' },
 { href: '/contact', label: 'Contact' },
 ].map(link => (
 <li key={link.href}>
 <Link href={link.href} className="text-gray-600 hover:text-green-600 text-sm transition flex items-center gap-1.5 group">
 <span className="w-1 h-1 rounded-full bg-green-500/50 group-hover:bg-green-500 transition" />
 {link.label}
 </Link>
 </li>
 ))}
 </ul>
 </div>

 {/* Policies */}
 <div>
 <h3 className="font-bold text-foreground mb-5 text-sm uppercase tracking-wider">Policies</h3>
 <ul className="space-y-2.5">
 {[
 { href: '/policies/privacy', label: 'Privacy Policy' },
 { href: '/policies/terms', label: 'Terms of Service' },
 { href: '/policies/refund', label: 'Refund Policy' },
 { href: '/policies/shipping', label: 'Shipping Policy' },
 ].map(link => (
 <li key={link.href}>
 <Link href={link.href} className="text-gray-600 hover:text-green-600 text-sm transition flex items-center gap-1.5 group">
 <span className="w-1 h-1 rounded-full bg-green-500/50 group-hover:bg-green-500 transition" />
 {link.label}
 </Link>
 </li>
 ))}
 </ul>
 </div>

 {/* Contact */}
 <div>
 <h3 className="font-bold text-foreground mb-5 text-sm uppercase tracking-wider">Contact Us</h3>
 <ul className="space-y-3 text-muted-foreground text-sm">
 <li className="flex items-center gap-3">
 <div className="w-7 h-7 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
 <Phone className="w-3.5 h-3.5 text-green-500" />
 </div>
 +91 9508716607
 </li>
 <li className="flex items-center gap-3">
 <div className="w-7 h-7 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
 <Mail className="w-3.5 h-3.5 text-green-500" />
 </div>
 info@nvanutrition.in
 </li>
 <li className="flex items-center gap-3">
 <div className="w-7 h-7 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
 <MapPin className="w-3.5 h-3.5 text-green-500" />
 </div>
 Noida, India
 </li>
 </ul>
 </div>
 </div>

 {/* Bottom bar */}
 <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
 <div className="text-center sm:text-left">
 <p className="text-gray-600 text-sm">© 2026 NVA Nutrition. All rights reserved.</p>
 <p className="text-gray-500 text-xs mt-0.5">Premium Sports Nutrition for Champions</p>
 </div>
 </div>
 </div>
 </footer>
 );
}
