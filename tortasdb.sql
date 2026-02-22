-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 09-06-2025 a las 02:40:08
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.1.25

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `tortasdb`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mensajes_contacto`
--

CREATE TABLE `mensajes_contacto` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `mensaje` text NOT NULL,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `mensajes_contacto`
--

INSERT INTO `mensajes_contacto` (`id`, `nombre`, `email`, `mensaje`, `fecha`) VALUES
(1, 'Junnior Marocho', 'junniormarocho4@gmail.com', 'hola info', '0000-00-00 00:00:00'),
(2, 'kun', 'kun@gmail.com', 'hola quiero info', '2025-06-07 06:43:21'),
(3, 'juan robles', 'juanrob@gmail.com', 'Buenas noches quiero una torta de moka para el domingo.', '2025-06-07 06:47:10'),
(5, 'Junnior Moises Marocho Quispimailla', 'junniormarocho4@gmail.com', 'holsdfedg', '2025-06-07 06:52:35'),
(6, 'Junnior Moises Marocho Quispimailla', 'junniormarocho4@gmail.com', 'hola esto es prueba', '2025-06-07 06:58:42'),
(7, 'Junnior Moises Marocho Quispimailla', 'junniormarocho4@gmail.com', 'prueba', '2025-06-07 07:00:15'),
(8, 'Junnior Marocho', 'junniormarocho4@gmail.com', 'hola esta es una prueba', '2025-06-09 00:05:33');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `reset_token` varchar(255) NOT NULL,
  `token_expiration` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `email`, `password`, `reset_token`, `token_expiration`) VALUES
(1, 'jeny', 'jeny12@gmail.com', '$2y$10$8MX0l5d9ZzzDCwzIi.dkr.PEQJriC7QHA3vneezqBZU7wS.sMxRSG', '', '0000-00-00 00:00:00'),
(2, 'jun', 'jun1214@gmail.com', '$2y$10$6MzApNMatpKM4D9pS67B9eekr0yQBKJV5Z0FZQXldOKu9DMB3sYUO', '', '0000-00-00 00:00:00'),
(3, 'yanet', 'yanet324@gmail.com', '$2y$10$9fNtqS.dTqWDle/EW9IBleV19Cnb0bd6ajtfgCQ1SurptmcFjHAUW', '', '0000-00-00 00:00:00'),
(4, 'Junnior Moises Marocho Quispimailla', 'junniormarocho4@gmail.com', '$2y$10$.DQpp/XxiHx9sisSVRdtiOVUAjJGmoLw0Y9xWUAnsyGEwTq.FUft.', '', '0000-00-00 00:00:00'),
(5, 'Maribel', 'maribel34@gmail.com', '$2y$10$rJI/nYuJE4QpUv8bSeljle5uJ4dvU97DBUR5/l725lCwUwviGTx5a', '', '0000-00-00 00:00:00');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `mensajes_contacto`
--
ALTER TABLE `mensajes_contacto`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `mensajes_contacto`
--
ALTER TABLE `mensajes_contacto`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
