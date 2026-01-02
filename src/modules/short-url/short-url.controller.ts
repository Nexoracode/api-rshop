import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { ShortUrlService } from './short-url.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from 'src/common/decorator/public.decorator';

@ApiTags('Short URL')
@Controller()
export class ShortUrlController {
  constructor(private readonly service: ShortUrlService) { }

  // /**
  //  * Redirect به لینک اصلی
  //  * 
  //  * مثال: https://rshl.link/dure0229 -> https://rshop.ir/orders/456
  //  */
  // @Public()
  // @Get(':code')
  // @ApiOperation({ summary: 'Redirect به لینک اصلی' })
  // async redirect(@Param('code') code: string, @Res() res: Response) {
  //   const baseUrl = process.env.FRONTEND_URL || 'rshl.link';
  //   // ✅ چک کن که code فقط حروف و اعداد باشه (8 کاراکتری)
  //   if (!/^[a-zA-Z0-9]{6,10}$/.test(code)) {
  //     return this.render404(res);
  //   }

  //   const url = await this.service.resolve(code);

  //   if (!url) {
  //     return this.render404(res);
  //   }

  //   // ✅ Redirect دائمی
  //   return res.redirect(301, url);
  // }

  // /**
  //  * نمایش صفحه 404 ساده
  //  */
  // private render404(res: Response) {
  //   res.status(404).send(`
  //     <!DOCTYPE html>
  //     <html dir="rtl" lang="fa">
  //     <head>
  //       <meta charset="UTF-8">
  //       <meta name="viewport" content="width=device-width, initial-scale=1.0">
  //       <title>لینک پیدا نشد - RSHOP</title>
  //       <style>
  //         * { margin: 0; padding: 0; box-sizing: border-box; }
  //         body {
  //           font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  //           background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  //           min-height: 100vh;
  //           display: flex;
  //           align-items: center;
  //           justify-content: center;
  //           color: white;
  //         }
  //         .container {
  //           text-align: center;
  //           padding: 2rem;
  //         }
  //         h1 {
  //           font-size: 6rem;
  //           margin-bottom: 1rem;
  //           animation: bounce 1s ease-in-out;
  //         }
  //         h2 {
  //           font-size: 2rem;
  //           margin-bottom: 1rem;
  //           font-weight: 300;
  //         }
  //         p {
  //           font-size: 1.2rem;
  //           margin-bottom: 2rem;
  //           opacity: 0.9;
  //         }
  //         .btn {
  //           display: inline-block;
  //           padding: 1rem 2rem;
  //           background: white;
  //           color: #667eea;
  //           text-decoration: none;
  //           border-radius: 50px;
  //           font-weight: bold;
  //           transition: transform 0.3s;
  //         }
  //         .btn:hover {
  //           transform: scale(1.05);
  //         }
  //         @keyframes bounce {
  //           0%, 100% { transform: translateY(0); }
  //           50% { transform: translateY(-20px); }
  //         }
  //       </style>
  //     </head>
  //     <body>
  //       <div class="container">
  //         <h1>404</h1>
  //         <h2>لینک پیدا نشد!</h2>
  //         <p>متأسفانه لینک کوتاه شما یافت نشد یا منقضی شده است.</p>
  //         <a href={baseUrl} class="btn">بازگشت به صفحه اصلی</a>
  //       </div>
  //     </body>
  //     </html>
  //   `);
  // }
}
