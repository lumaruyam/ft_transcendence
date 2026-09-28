/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   tokenCrypt.ts                                      :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lulmaruy <lulmaruy@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/09/28 19:08:13 by lulmaruy          #+#    #+#             */
/*   Updated: 2026/09/28 19:10:27 by lulmaruy         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: application-level encryption of OAuth access/refresh tokens before they're
// persisted to OAuthAccount. store the user's GitHub token so the backend can call GitHub on the user's behalf
// Track 3's Octokit branch create/list calls), using `crypto.createCipheriv` + a key from env
// rather than a managed KMS, since that's proportionate for this project. Postgres only ever
// sees the ciphertext this module produces — OAuthAccount.accessToken/refreshToken never hold a
// usable plaintext token.

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = 
