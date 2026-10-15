import net from 'node:net';

// Node probiert IPv4 und IPv6 parallel und gibt jedem Verbindungsversuch nur
// 250 ms. Is der Server grad beschäftigt (Kompilieren, scrypt), bricht so a
// fetch zu Nominatim nach ~1 s mit ETIMEDOUT ab, und neue Stammtische standen
// ohne Kartenmitte da (Nachtest 15.10.2026). 3 s pro Versuch reichen locker.
net.setDefaultAutoSelectFamilyAttemptTimeout(3000);
