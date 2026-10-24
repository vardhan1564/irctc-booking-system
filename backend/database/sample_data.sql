-- Demo data so you can test the full flow immediately.
USE irctc;

-- Admin login: admin / admin123
-- (Stored as plain text on purpose: the app upgrades it to BCrypt on first login.)
INSERT IGNORE INTO admins (username, password, full_name) VALUES ('admin', 'admin123', 'System Administrator');

INSERT IGNORE INTO stations (station_code, station_name, city_name) VALUES
('NDLS','New Delhi','Delhi'), ('MMCT','Mumbai Central','Mumbai'), ('BRC','Vadodara Junction','Vadodara'),
('RTM','Ratlam Junction','Ratlam'), ('KOTA','Kota Junction','Kota'), ('NK','Nashik Road','Nashik'),
('CSMT','Chhatrapati Shivaji Maharaj Terminus','Mumbai'), ('BSL','Bhusaval Junction','Bhusaval'),
('PUNE','Pune Junction','Pune'), ('SBC','KSR Bengaluru','Bengaluru');

INSERT INTO trains (train_name, train_number, source, destination, departure_time, arrival_time, total_seats, available_seats, fare_per_km)
SELECT 'Mumbai Rajdhani Express','12952','New Delhi','Mumbai Central','16:55:00','08:35:00',400,300,1.20
WHERE NOT EXISTS (SELECT 1 FROM trains WHERE train_number='12952');
INSERT INTO trains (train_name, train_number, source, destination, departure_time, arrival_time, total_seats, available_seats, fare_per_km)
SELECT 'Panchavati Express','12110','Mumbai CSMT','Manmad','06:15:00','10:40:00',500,420,0.80
WHERE NOT EXISTS (SELECT 1 FROM trains WHERE train_number='12110');

INSERT INTO train_stops (train_id, station_code, station_name, stop_number, arrival_time, departure_time, distance_from_source)
SELECT t.train_id, s.code, s.name, s.num, s.arr, s.dep, s.dist FROM trains t
JOIN (SELECT 'NDLS' code,'New Delhi' name,1 num,NULL arr,'16:55:00' dep,0 dist
      UNION ALL SELECT 'KOTA','Kota Junction',2,'21:35:00','21:45:00',465
      UNION ALL SELECT 'RTM','Ratlam Junction',3,'00:55:00','00:58:00',731
      UNION ALL SELECT 'BRC','Vadodara Junction',4,'03:50:00','04:00:00',992
      UNION ALL SELECT 'MMCT','Mumbai Central',5,'08:35:00',NULL,1384) s
WHERE t.train_number='12952' AND NOT EXISTS (SELECT 1 FROM train_stops x WHERE x.train_id=t.train_id);

INSERT INTO train_stops (train_id, station_code, station_name, stop_number, arrival_time, departure_time, distance_from_source)
SELECT t.train_id, s.code, s.name, s.num, s.arr, s.dep, s.dist FROM trains t
JOIN (SELECT 'CSMT' code,'Chhatrapati Shivaji Maharaj Terminus' name,1 num,NULL arr,'06:15:00' dep,0 dist
      UNION ALL SELECT 'NK','Nashik Road',2,'10:15:00','10:20:00',187) s
WHERE t.train_number='12110' AND NOT EXISTS (SELECT 1 FROM train_stops x WHERE x.train_id=t.train_id);

INSERT INTO food_menu (item_name, description, price, type, category)
SELECT * FROM (SELECT 'Masala Dosa' a,'Crispy dosa with potato masala, sambar and chutney.' b,90.00 c,'VEG' d,'BREAKFAST' e
 UNION ALL SELECT 'Poha','Flattened rice with onions, peanuts and lemon.',50.00,'VEG','BREAKFAST'
 UNION ALL SELECT 'Veg Thali','Rice, 2 rotis, dal, seasonal sabzi, curd and pickle.',150.00,'VEG','LUNCH'
 UNION ALL SELECT 'Chicken Biryani','Hyderabadi dum biryani with raita.',220.00,'NON_VEG','LUNCH'
 UNION ALL SELECT 'Samosa (2 pcs)','Fried pastry with spiced potato filling.',40.00,'VEG','SNACKS'
 UNION ALL SELECT 'Masala Chai','Hot tea with ginger and cardamom.',20.00,'VEG','ALL_DAY') v
WHERE NOT EXISTS (SELECT 1 FROM food_menu);
