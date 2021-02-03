# Literal autolinks

## WWW autolinks

w.commonmark.org

ww.commonmark.org

www.commonmark.org

Www.commonmark.org

wWw.commonmark.org

wwW.commonmark.org

WWW.COMMONMARK.ORG

Visit www.commonmark.org/help for more information.

Visit www.commonmark.org.

Visit www.commonmark.org/a.b.

www.aaa.bbb.ccc_ccc

www.aaa_bbb.ccc

www.aaa.bbb.ccc.ddd_ddd

www.aaa.bbb.ccc_ccc.ddd

www.aaa.bbb_bbb.ccc.ddd

www.aaa_aaa.bbb.ccc.ddd

Visit www.commonmark.org.

Visit www.commonmark.org/a.b.

www.google.com/search?q=Markup+(business)

www.google.com/search?q=Markup+(business)))

(www.google.com/search?q=Markup+(business))

(www.google.com/search?q=Markup+(business)

www.google.com/search?q=(business))+ok

www.google.com/search?q=commonmark&hl=en

www.google.com/search?q=commonmark&hl;en

www.google.com/search?q=commonmark&hl;

www.commonmark.org/he<lp

## HTTP autolinks

hexample.com

htexample.com

httexample.com

httpexample.com

http:example.com

http:/example.com

https:/example.com

http://example.com

https://example.com

https://example

http://commonmark.org

(Visit https://encrypted.google.com/search?q=Markup+(business))

## Email autolinks

No dot: foo@barbaz

No dot: foo@barbaz.

foo@bar.baz

hello@mail+xyz.example isn’t valid, but hello+xyz@mail.example is.

a.b-c_d@a.b

a.b-c_d@a.b.

a.b-c_d@a.b-

a.b-c_d@a.b_

a@a_b.c

a@a-b.c

Can’t end in an underscore followed by a period: aaa@a.b_.

Can contain an underscore followed by a period: aaa@a.b_.c

## Link text should not be expanded

[Visit www.example.com](http://www.example.com) please.

[Visit http://www.example.com](http://www.example.com) please.

[Mail example@example.com](mailto:example@example.com) please.

[link]() <http://autolink> should still be expanded.
