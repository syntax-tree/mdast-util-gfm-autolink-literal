# HTTP

https://a.b can start after EOF

Can start after EOL:
https://a.b

Can start after tab:	https://a.b.

Can start after space: https://a.b.

Can start after left paren (https://a.b.

Can start after asterisk *https://a.b.

Can start after underscore *_https://a.b.

Can start after tilde ~https://a.b.

# www

www.a.b can start after EOF

Can start after EOL:
www.a.b

Can start after tab:	www.a.b.

Can start after space: www.a.b.

Can start after left paren (www.a.b.

Can start after asterisk *www.a.b.

Can start after underscore *_www.a.b.

Can start after tilde ~www.a.b.

# Email

## Correct character before

a@b.c can start after EOF

Can start after EOL:
a@b.c

Can start after tab:	a@b.c.

Can start after space: a@b.c.

Can start after left paren(a@b.c.

Can start after asterisk*a@b.c.

While theoretically it’s possible to start at an underscore, that underscore
is part of the email, so it’s in fact part of the link: _a@b.c.

Can start after tilde~a@b.c.

## Others characters before

While other characters before the email aren’t allowed by GFM, they work on
github.com: !a@b.c, "a@b.c, #a@b.c, $a@b.c, &a@b.c, 'a@b.c, )a@b.c, +a@b.c,
,a@b.c, -a@b.c, .a@b.c, /a@b.c, :a@b.c, ;a@b.c, <a@b.c, =a@b.c, >a@b.c, ?a@b.c,
@a@b.c, \a@b.c, ]a@b.c, ^a@b.c, `a@b.c, {a@b.c, }a@b.c.

## remarkjs/remark#678

,https://github.com

[ ,https://github.com

[asd] ,https://github.com
